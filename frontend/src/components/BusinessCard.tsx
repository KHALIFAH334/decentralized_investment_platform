'use client';

import React from 'react';
import Link from 'next/link';
import { BusinessData } from '../hooks/useBusinesses';

interface BusinessCardProps {
  business: BusinessData;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const ownerStr = business.owner;
  const truncatedOwner = `${ownerStr.slice(0, 4)}...${ownerStr.slice(-4)}`;
  const fundingGoalSOL = business.fundingGoal / 1e9;
  const totalRaisedSOL = business.totalRaised / 1e9;
  const progressPercent = Math.min((business.totalRaised / business.fundingGoal) * 100, 100);
  
  let statusBadgeClass = 'badge-funding';
  let statusText = 'Funding';
  if (business.isClosed) {
    statusBadgeClass = 'badge-closed';
    statusText = 'Closed';
  } else if (business.isFunded) {
    statusBadgeClass = 'badge-funded';
    statusText = 'Funded';
  }

  return (
    <Link href={`/businesses/${business.publicKey}`}>
      <div className="card fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span className="text-sm font-mono text-gray-400">{truncatedOwner}</span>
          <span className={`badge ${statusBadgeClass}`}>{statusText}</span>
        </div>
        
        <h3 className="text-lg font-bold mb-2">Goal: {fundingGoalSOL} SOL</h3>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>{totalRaisedSOL} SOL raised</span>
            <span>{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Equity: {business.equityPercentage}%</span>
          <span>Tokens: {business.totalEquityTokens.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}
