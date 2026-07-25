/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/decentralized_investment_platform.json`.
 */
export type DecentralizedInvestmentPlatform = {
  "address": "5gEZHMQfMSKofq89gBkWPzwx7g1vy3d1pn8RJjRSkN4Z",
  "metadata": {
    "name": "decentralizedInvestmentPlatform",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "A decentralized investment platform for local businesses on Solana"
  },
  "instructions": [
    {
      "name": "closeBusiness",
      "docs": [
        "Gracefully closes a business. Can only be called by the owner.",
        "Marks the business as closed to prevent further investments."
      ],
      "discriminator": [
        216,
        38,
        238,
        233,
        26,
        13,
        26,
        15
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "businessState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  115,
                  105,
                  110,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "distributeDividends",
      "docs": [
        "Business owner distributes dividends (SOL) proportionally to equity token holders.",
        "The owner deposits SOL, and a specific investor can claim their share",
        "proportional to their token holdings relative to the total supply."
      ],
      "discriminator": [
        185,
        147,
        6,
        245,
        80,
        98,
        186,
        136
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "businessState",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  115,
                  105,
                  110,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "equityMint"
        },
        {
          "name": "investor",
          "docs": [
            "The investor receiving their dividend share."
          ],
          "writable": true
        },
        {
          "name": "investorTokenAccount",
          "docs": [
            "The investor's token account — used to read their balance for proportional calculation."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "investor"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "equityMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "totalDividendLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeBusiness",
      "docs": [
        "Initializes a new business listing on the platform.",
        "Creates a PDA to store business state and a Token-2022 equity mint",
        "with TransferFeeConfig (protocol monetization) and PermanentDelegate (compliance)."
      ],
      "discriminator": [
        224,
        230,
        190,
        93,
        141,
        151,
        35,
        237
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "businessState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  115,
                  105,
                  110,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "equityMint",
          "docs": [
            "The Token-2022 equity mint — initialized manually via CPI",
            "with TransferFeeConfig + PermanentDelegate extensions."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "fundingGoal",
          "type": "u64"
        },
        {
          "name": "equityPercentage",
          "type": "u8"
        },
        {
          "name": "totalEquityTokens",
          "type": "u64"
        }
      ]
    },
    {
      "name": "invest",
      "docs": [
        "Allows an investor to contribute SOL to a business.",
        "SOL is held in the business PDA escrow.",
        "Equity tokens are minted proportionally to the investor."
      ],
      "discriminator": [
        13,
        245,
        180,
        103,
        254,
        182,
        121,
        4
      ],
      "accounts": [
        {
          "name": "investor",
          "writable": true,
          "signer": true
        },
        {
          "name": "businessState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  115,
                  105,
                  110,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "businessState.owner",
                "account": "businessState"
              }
            ]
          }
        },
        {
          "name": "equityMint",
          "writable": true
        },
        {
          "name": "investorTokenAccount",
          "docs": [
            "The investor's associated token account for the equity mint.",
            "Created with `init_if_needed` so new investors don't need a separate tx."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "investor"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "equityMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amountLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawFunds",
      "docs": [
        "Business owner withdraws raised SOL after funding goal is met."
      ],
      "discriminator": [
        241,
        36,
        29,
        111,
        208,
        31,
        104,
        217
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "businessState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  115,
                  105,
                  110,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amountLamports",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "businessState",
      "discriminator": [
        184,
        233,
        134,
        44,
        145,
        249,
        177,
        115
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidFundingGoal",
      "msg": "Funding goal must be greater than zero"
    },
    {
      "code": 6001,
      "name": "invalidEquityPercentage",
      "msg": "Equity percentage must be between 1 and 100"
    },
    {
      "code": 6002,
      "name": "invalidTokenSupply",
      "msg": "Total equity token supply must be greater than zero"
    },
    {
      "code": 6003,
      "name": "invalidInvestmentAmount",
      "msg": "Investment amount must be greater than zero"
    },
    {
      "code": 6004,
      "name": "investmentTooSmall",
      "msg": "Investment too small to mint any equity tokens"
    },
    {
      "code": 6005,
      "name": "businessClosed",
      "msg": "Business is closed and no longer accepting investments"
    },
    {
      "code": 6006,
      "name": "alreadyFunded",
      "msg": "Business has already reached its funding goal"
    },
    {
      "code": 6007,
      "name": "notYetFunded",
      "msg": "Business has not yet reached its funding goal"
    },
    {
      "code": 6008,
      "name": "invalidWithdrawAmount",
      "msg": "Withdrawal amount must be greater than zero"
    },
    {
      "code": 6009,
      "name": "insufficientFunds",
      "msg": "Insufficient funds in escrow for withdrawal"
    },
    {
      "code": 6010,
      "name": "invalidDividendAmount",
      "msg": "Dividend amount must be greater than zero"
    },
    {
      "code": 6011,
      "name": "noTokensInCirculation",
      "msg": "No tokens in circulation — cannot distribute dividends"
    },
    {
      "code": 6012,
      "name": "noTokensHeld",
      "msg": "Investor holds no equity tokens"
    },
    {
      "code": 6013,
      "name": "dividendTooSmall",
      "msg": "Dividend share too small to distribute"
    },
    {
      "code": 6014,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6015,
      "name": "unauthorized",
      "msg": "You are not authorized to perform this action"
    }
  ],
  "types": [
    {
      "name": "businessState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "docs": [
              "The wallet address of the business owner"
            ],
            "type": "pubkey"
          },
          {
            "name": "fundingGoal",
            "docs": [
              "Funding goal in lamports"
            ],
            "type": "u64"
          },
          {
            "name": "equityPercentage",
            "docs": [
              "Percentage of equity offered to investors (1-100)"
            ],
            "type": "u8"
          },
          {
            "name": "totalRaised",
            "docs": [
              "Total SOL raised so far in lamports"
            ],
            "type": "u64"
          },
          {
            "name": "totalEquityTokens",
            "docs": [
              "Total equity tokens to be distributed"
            ],
            "type": "u64"
          },
          {
            "name": "isFunded",
            "docs": [
              "Whether the funding goal has been reached"
            ],
            "type": "bool"
          },
          {
            "name": "isClosed",
            "docs": [
              "Whether the business listing is closed"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          },
          {
            "name": "mintKey",
            "docs": [
              "The equity token mint address"
            ],
            "type": "pubkey"
          }
        ]
      }
    }
  ]
};
