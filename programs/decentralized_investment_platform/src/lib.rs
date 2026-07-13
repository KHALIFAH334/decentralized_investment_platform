use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

declare_id!("AZomM5ytawD2ajpvWhx9B4SVyYK2K6U1JkXrcL4g7DWR");

#[program]
pub mod decentralized_investment_platform {
    use super::*;

    pub fn initialize_business(
        ctx: Context<InitializeBusiness>, 
        funding_goal: u64, 
        equity_percentage: u8
    ) -> Result<()> {
        let business_state = &mut ctx.accounts.business_state;
        let owner = &ctx.accounts.owner;

        business_state.owner = owner.key();
        business_state.funding_goal = funding_goal;
        business_state.equity_percentage = equity_percentage;
        business_state.total_raised = 0;
        business_state.bump = ctx.bumps.business_state; 
        business_state.mint_key = ctx.accounts.equity_mint.key();

        msg!("Business initialized and Token-2022 Equity Mint created!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeBusiness<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init, 
        payer = owner, 
        space = 8 + 32 + 8 + 1 + 8 + 1 + 32, // Added 32 bytes for the mint_key pubkey
        seeds = [b"business", owner.key().as_ref()], 
        bump
    )]
    pub business_state: Account<'info, BusinessState>,

    // MINTING THE EQUITY TOKEN (Token-2022)
    #[account(
        init,
        payer = owner,
        mint::decimals = 6,
        mint::authority = business_state, // The PDA controls the mint, ensuring decentralization
        mint::token_program = token_program,
        // Extension 1: Protocol Monetization (0.3% = 30 basis points)
        extensions::transfer_fee_config::transfer_fee_config_authority = owner,
        extensions::transfer_fee_config::withdraw_withheld_authority = owner,
        extensions::transfer_fee_config::fee_basis_points = 30, 
        // Extension 2: Compliance / Breach Resolution
        extensions::permanent_delegate::delegate = owner, 
    )]
    pub equity_mint: InterfaceAccount<'info, Mint>,

    // We use TokenInterface to explicitly support Token-2022
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct BusinessState {
    pub owner: Pubkey,         
    pub funding_goal: u64,     
    pub equity_percentage: u8, 
    pub total_raised: u64,     
    pub bump: u8,              
    pub mint_key: Pubkey,      // Links the business to its unique equity token
}