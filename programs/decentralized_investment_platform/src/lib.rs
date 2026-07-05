use anchor_lang::prelude::*;

// This is your program's unique public key (Anchor generates this automatically)
declare_id!("ReplaceWithYourProgramIdHere");

#[program]
pub mod decentralized_investment_platform {
    use super::*;

    // Instruction 1: Initialize a new business fundraising campaign
    pub fn initialize_business(
        ctx: Context<InitializeBusiness>, 
        funding_goal: u64, 
        equity_percentage: u8
    ) -> Result<()> {
        let business_state = &mut ctx.accounts.business_state;
        let owner = &ctx.accounts.owner;

        // Store the business parameters on-chain
        business_state.owner = owner.key();
        business_state.funding_goal = funding_goal;
        business_state.equity_percentage = equity_percentage;
        business_state.total_raised = 0;
        
        // The bump seed is saved to validate the PDA later
        business_state.bump = ctx.bumps.business_state; 

        msg!("Business campaign initialized successfully!");
        Ok(())
    }
}

// Validation Struct: Defines the accounts required for the InitializeBusiness instruction
#[derive(Accounts)]
pub struct InitializeBusiness<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    // Engineering the PDA: This creates an escrow/state account uniquely tied to the owner
    #[account(
        init, 
        payer = owner, 
        space = 8 + 32 + 8 + 1 + 8 + 1, // Discriminator + Pubkey + u64 + u8 + u64 + u8
        seeds = [b"business", owner.key().as_ref()], 
        bump
    )]
    pub business_state: Account<'info, BusinessState>,

    pub system_program: Program<'info, System>,
}

// State Struct: The actual data stored inside the PDA
#[account]
pub struct BusinessState {
    pub owner: Pubkey,         // The local business owner's wallet address
    pub funding_goal: u64,     // The target amount in USDC
    pub equity_percentage: u8, // The percentage of the business being tokenized
    pub total_raised: u64,     // Tracker for funds currently in escrow
    pub bump: u8,              // Secure routing bump for the PDA
}