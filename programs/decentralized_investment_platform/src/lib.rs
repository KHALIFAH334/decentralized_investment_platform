use anchor_lang::prelude::*;
use anchor_lang::system_program::{create_account, CreateAccount};
use anchor_spl::token_interface::{
    Mint, TokenAccount, TokenInterface,
    mint_to, MintTo,
    spl_token_2022,
};

declare_id!("5gEZHMQfMSKofq89gBkWPzwx7g1vy3d1pn8RJjRSkN4Z");

// ============================================================================
// CONSTANTS
// ============================================================================

/// Transfer fee: 0.3% = 30 basis points
const TRANSFER_FEE_BASIS_POINTS: u16 = 30;

/// Maximum fee per transfer in token base units (1,000,000 = 1 token with 6 decimals)
const MAXIMUM_FEE: u64 = 1_000_000;

/// Equity token decimals
const EQUITY_DECIMALS: u8 = 6;

// ============================================================================
// PROGRAM
// ============================================================================

#[program]
pub mod decentralized_investment_platform {
    use super::*;

    /// Initializes a new business listing on the platform.
    /// Creates a PDA to store business state and a Token-2022 equity mint
    /// with TransferFeeConfig (protocol monetization) and PermanentDelegate (compliance).
    pub fn initialize_business(
        ctx: Context<InitializeBusiness>,
        funding_goal: u64,
        equity_percentage: u8,
        total_equity_tokens: u64,
    ) -> Result<()> {
        require!(funding_goal > 0, DipError::InvalidFundingGoal);
        require!(
            equity_percentage > 0 && equity_percentage <= 100,
            DipError::InvalidEquityPercentage
        );
        require!(total_equity_tokens > 0, DipError::InvalidTokenSupply);

        // --- Step 1: Create the mint account with space for extensions ---
        let extensions = &[
            spl_token_2022::extension::ExtensionType::TransferFeeConfig,
            spl_token_2022::extension::ExtensionType::PermanentDelegate,
        ];
        let space = spl_token_2022::extension::ExtensionType::try_calculate_account_len::<
            spl_token_2022::state::Mint,
        >(extensions)
        .map_err(|_| DipError::Overflow)?;

        let lamports = Rent::get()?.minimum_balance(space);

        create_account(
            CpiContext::new(
                ctx.accounts.system_program.key(),
                CreateAccount {
                    from: ctx.accounts.owner.to_account_info(),
                    to: ctx.accounts.equity_mint.to_account_info(),
                },
            ),
            lamports,
            space as u64,
            &ctx.accounts.token_program.key(),
        )?;

        // --- Step 2: Initialize TransferFeeConfig extension ---
        let ix_transfer_fee =
            spl_token_2022::extension::transfer_fee::instruction::initialize_transfer_fee_config(
                &ctx.accounts.token_program.key(),
                &ctx.accounts.equity_mint.key(),
                Some(&ctx.accounts.owner.key()),  // transfer_fee_config_authority
                Some(&ctx.accounts.owner.key()),  // withdraw_withheld_authority
                TRANSFER_FEE_BASIS_POINTS,
                MAXIMUM_FEE,
            )?;
        anchor_lang::solana_program::program::invoke(
            &ix_transfer_fee,
            &[ctx.accounts.equity_mint.to_account_info()],
        )?;

        // --- Step 3: Initialize PermanentDelegate extension ---
        let ix_permanent_delegate =
            spl_token_2022::instruction::initialize_permanent_delegate(
                &ctx.accounts.token_program.key(),
                &ctx.accounts.equity_mint.key(),
                &ctx.accounts.owner.key(),  // delegate
            )?;
        anchor_lang::solana_program::program::invoke(
            &ix_permanent_delegate,
            &[ctx.accounts.equity_mint.to_account_info()],
        )?;

        // --- Step 4: Initialize the mint itself ---
        let ix_init_mint = spl_token_2022::instruction::initialize_mint2(
            &ctx.accounts.token_program.key(),
            &ctx.accounts.equity_mint.key(),
            &ctx.accounts.business_state.key(),  // mint authority = PDA
            None,                                 // no freeze authority
            EQUITY_DECIMALS,
        )?;
        anchor_lang::solana_program::program::invoke(
            &ix_init_mint,
            &[ctx.accounts.equity_mint.to_account_info()],
        )?;

        // --- Step 5: Populate the business state PDA ---
        let business_state = &mut ctx.accounts.business_state;
        business_state.owner = ctx.accounts.owner.key();
        business_state.funding_goal = funding_goal;
        business_state.equity_percentage = equity_percentage;
        business_state.total_equity_tokens = total_equity_tokens;
        business_state.total_raised = 0;
        business_state.is_funded = false;
        business_state.is_closed = false;
        business_state.bump = ctx.bumps.business_state;
        business_state.mint_key = ctx.accounts.equity_mint.key();

        msg!(
            "Business initialized! Goal: {} lamports, Equity: {}%, Tokens: {}",
            funding_goal,
            equity_percentage,
            total_equity_tokens
        );

        Ok(())
    }

    /// Allows an investor to contribute SOL to a business.
    /// SOL is held in the business PDA escrow.
    /// Equity tokens are minted proportionally to the investor.
    pub fn invest(ctx: Context<Invest>, amount_lamports: u64) -> Result<()> {
        // Read state values before taking a mutable reference
        let is_closed = ctx.accounts.business_state.is_closed;
        let is_funded = ctx.accounts.business_state.is_funded;
        let funding_goal = ctx.accounts.business_state.funding_goal;
        let total_raised = ctx.accounts.business_state.total_raised;
        let total_equity_tokens = ctx.accounts.business_state.total_equity_tokens;
        let owner_key = ctx.accounts.business_state.owner;
        let bump = ctx.accounts.business_state.bump;

        require!(!is_closed, DipError::BusinessClosed);
        require!(!is_funded, DipError::AlreadyFunded);
        require!(amount_lamports > 0, DipError::InvalidInvestmentAmount);

        // Check that the investment doesn't exceed the funding goal
        let remaining = funding_goal
            .checked_sub(total_raised)
            .ok_or(DipError::Overflow)?;
        let actual_investment = amount_lamports.min(remaining);

        // Transfer SOL from investor to the business PDA (escrow)
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.key(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.investor.to_account_info(),
                to: ctx.accounts.business_state.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, actual_investment)?;

        // Calculate proportional equity tokens to mint
        // tokens_to_mint = (actual_investment / funding_goal) * total_equity_tokens
        let tokens_to_mint = (actual_investment as u128)
            .checked_mul(total_equity_tokens as u128)
            .ok_or(DipError::Overflow)?
            .checked_div(funding_goal as u128)
            .ok_or(DipError::Overflow)? as u64;

        require!(tokens_to_mint > 0, DipError::InvestmentTooSmall);

        // Mint equity tokens to the investor's token account
        // The business_state PDA is the mint authority, so we need signer seeds
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"business",
            owner_key.as_ref(),
            &[bump],
        ]];

        let mint_cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            MintTo {
                mint: ctx.accounts.equity_mint.to_account_info(),
                to: ctx.accounts.investor_token_account.to_account_info(),
                authority: ctx.accounts.business_state.to_account_info(),
            },
            signer_seeds,
        );
        mint_to(mint_cpi_ctx, tokens_to_mint)?;

        // Update state
        let business_state = &mut ctx.accounts.business_state;
        business_state.total_raised = total_raised
            .checked_add(actual_investment)
            .ok_or(DipError::Overflow)?;

        if business_state.total_raised >= business_state.funding_goal {
            business_state.is_funded = true;
            msg!("Business is fully funded!");
        }

        msg!(
            "Investment: {} lamports, {} equity tokens minted. Total raised: {}/{}",
            actual_investment,
            tokens_to_mint,
            business_state.total_raised,
            business_state.funding_goal
        );

        Ok(())
    }

    /// Business owner withdraws raised SOL after funding goal is met.
    pub fn withdraw_funds(ctx: Context<WithdrawFunds>, amount_lamports: u64) -> Result<()> {
        let business_state = &mut ctx.accounts.business_state;

        require!(!business_state.is_closed, DipError::BusinessClosed);
        require!(business_state.is_funded, DipError::NotYetFunded);
        require!(amount_lamports > 0, DipError::InvalidWithdrawAmount);

        // Ensure we don't withdraw more than available (keeping rent-exempt minimum)
        let business_account_info = business_state.to_account_info();
        let rent = Rent::get()?;
        let min_balance = rent.minimum_balance(business_account_info.data_len());
        let available = business_account_info
            .lamports()
            .checked_sub(min_balance)
            .ok_or(DipError::InsufficientFunds)?;

        require!(amount_lamports <= available, DipError::InsufficientFunds);

        // Transfer SOL from PDA to owner
        business_state.sub_lamports(amount_lamports)?;
        ctx.accounts.owner.add_lamports(amount_lamports)?;

        msg!("Owner withdrew {} lamports.", amount_lamports);

        Ok(())
    }

    /// Business owner distributes dividends (SOL) proportionally to equity token holders.
    /// The owner deposits SOL, and a specific investor can claim their share
    /// proportional to their token holdings relative to the total supply.
    pub fn distribute_dividends(
        ctx: Context<DistributeDividends>,
        total_dividend_lamports: u64,
    ) -> Result<()> {
        let business_state = &ctx.accounts.business_state;

        require!(!business_state.is_closed, DipError::BusinessClosed);
        require!(business_state.is_funded, DipError::NotYetFunded);
        require!(total_dividend_lamports > 0, DipError::InvalidDividendAmount);

        let investor_token_balance = ctx.accounts.investor_token_account.amount;
        let total_supply = ctx.accounts.equity_mint.supply;

        require!(total_supply > 0, DipError::NoTokensInCirculation);
        require!(investor_token_balance > 0, DipError::NoTokensHeld);

        // Calculate this investor's share
        // share = (investor_balance / total_supply) * total_dividend
        let share = (total_dividend_lamports as u128)
            .checked_mul(investor_token_balance as u128)
            .ok_or(DipError::Overflow)?
            .checked_div(total_supply as u128)
            .ok_or(DipError::Overflow)? as u64;

        require!(share > 0, DipError::DividendTooSmall);

        // Transfer SOL from owner to investor
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.key(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.owner.to_account_info(),
                to: ctx.accounts.investor.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, share)?;

        msg!(
            "Dividend distributed: {} lamports to investor (holds {}/{} tokens)",
            share,
            investor_token_balance,
            total_supply
        );

        Ok(())
    }

    /// Gracefully closes a business. Can only be called by the owner.
    /// Marks the business as closed to prevent further investments.
    pub fn close_business(ctx: Context<CloseBusiness>) -> Result<()> {
        let business_state = &mut ctx.accounts.business_state;
        require!(!business_state.is_closed, DipError::BusinessClosed);

        business_state.is_closed = true;

        msg!("Business closed by owner. No further investments accepted.");
        Ok(())
    }
}

// ============================================================================
// ACCOUNT CONTEXTS
// ============================================================================

#[derive(Accounts)]
pub struct InitializeBusiness<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + BusinessState::INIT_SPACE,
        seeds = [b"business", owner.key().as_ref()],
        bump
    )]
    pub business_state: Account<'info, BusinessState>,

    /// The Token-2022 equity mint — initialized manually via CPI
    /// with TransferFeeConfig + PermanentDelegate extensions.
    /// CHECK: We create and initialize this account manually in the instruction logic.
    #[account(mut, signer)]
    pub equity_mint: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Invest<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(
        mut,
        seeds = [b"business", business_state.owner.as_ref()],
        bump = business_state.bump,
    )]
    pub business_state: Account<'info, BusinessState>,

    #[account(
        mut,
        address = business_state.mint_key,
    )]
    pub equity_mint: InterfaceAccount<'info, Mint>,

    /// The investor's associated token account for the equity mint.
    /// Created with `init_if_needed` so new investors don't need a separate tx.
    #[account(
        init_if_needed,
        payer = investor,
        associated_token::mint = equity_mint,
        associated_token::authority = investor,
        associated_token::token_program = token_program,
    )]
    pub investor_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(
        mut,
        constraint = owner.key() == business_state.owner @ DipError::Unauthorized
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"business", owner.key().as_ref()],
        bump = business_state.bump,
    )]
    pub business_state: Account<'info, BusinessState>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributeDividends<'info> {
    #[account(
        mut,
        constraint = owner.key() == business_state.owner @ DipError::Unauthorized
    )]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"business", owner.key().as_ref()],
        bump = business_state.bump,
    )]
    pub business_state: Account<'info, BusinessState>,

    #[account(address = business_state.mint_key)]
    pub equity_mint: InterfaceAccount<'info, Mint>,

    /// The investor receiving their dividend share.
    /// CHECK: This is the investor's wallet — we just transfer SOL to it.
    #[account(mut)]
    pub investor: UncheckedAccount<'info>,

    /// The investor's token account — used to read their balance for proportional calculation.
    #[account(
        associated_token::mint = equity_mint,
        associated_token::authority = investor,
        associated_token::token_program = token_program,
    )]
    pub investor_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseBusiness<'info> {
    #[account(
        mut,
        constraint = owner.key() == business_state.owner @ DipError::Unauthorized
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"business", owner.key().as_ref()],
        bump = business_state.bump,
    )]
    pub business_state: Account<'info, BusinessState>,
}

// ============================================================================
// STATE
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct BusinessState {
    /// The wallet address of the business owner
    pub owner: Pubkey,            // 32
    /// Funding goal in lamports
    pub funding_goal: u64,        // 8
    /// Percentage of equity offered to investors (1-100)
    pub equity_percentage: u8,    // 1
    /// Total SOL raised so far in lamports
    pub total_raised: u64,        // 8
    /// Total equity tokens to be distributed
    pub total_equity_tokens: u64, // 8
    /// Whether the funding goal has been reached
    pub is_funded: bool,          // 1
    /// Whether the business listing is closed
    pub is_closed: bool,          // 1
    /// PDA bump seed
    pub bump: u8,                 // 1
    /// The equity token mint address
    pub mint_key: Pubkey,         // 32
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum DipError {
    #[msg("Funding goal must be greater than zero")]
    InvalidFundingGoal,
    #[msg("Equity percentage must be between 1 and 100")]
    InvalidEquityPercentage,
    #[msg("Total equity token supply must be greater than zero")]
    InvalidTokenSupply,
    #[msg("Investment amount must be greater than zero")]
    InvalidInvestmentAmount,
    #[msg("Investment too small to mint any equity tokens")]
    InvestmentTooSmall,
    #[msg("Business is closed and no longer accepting investments")]
    BusinessClosed,
    #[msg("Business has already reached its funding goal")]
    AlreadyFunded,
    #[msg("Business has not yet reached its funding goal")]
    NotYetFunded,
    #[msg("Withdrawal amount must be greater than zero")]
    InvalidWithdrawAmount,
    #[msg("Insufficient funds in escrow for withdrawal")]
    InsufficientFunds,
    #[msg("Dividend amount must be greater than zero")]
    InvalidDividendAmount,
    #[msg("No tokens in circulation — cannot distribute dividends")]
    NoTokensInCirculation,
    #[msg("Investor holds no equity tokens")]
    NoTokensHeld,
    #[msg("Dividend share too small to distribute")]
    DividendTooSmall,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
}