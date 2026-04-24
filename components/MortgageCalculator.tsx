'use client'

import { useState, useEffect } from 'react'

export default function MortgageCalculator({ price, priceType }: { price: number, priceType: string }) {
  const [deposit, setDeposit] = useState(10)
  const [rate, setRate] = useState(11.75)
  const [term, setTerm] = useState(20)
  const [monthly, setMonthly] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [transferCosts, setTransferCosts] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    calculate()
  }, [deposit, rate, term, price])

  const calculate = () => {
    const depositAmount = price * (deposit / 100)
    const loanAmount = price - depositAmount
    const monthlyRate = rate / 100 / 12
    const payments = term * 12
    
    const monthly = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, payments)) / 
                   (Math.pow(1 + monthlyRate, payments) - 1)
    
    setMonthly(Math.round(monthly))
    setTotalCost(Math.round(monthly * payments))

    // Transfer duty calculation (South Africa 2024)
    let transfer = 0
    if (price > 1100000) transfer = (price - 1100000) * 0.03
    if (price > 1512500) transfer = 12375 + (price - 1512500) * 0.06
    if (price > 2117500) transfer = 48675 + (price - 2117500) * 0.08
    if (price > 2722500) transfer = 97075 + (price - 2722500) * 0.11
    if (price > 12100000) transfer = 1128600 + (price - 12100000) * 0.13

    // Bond registration costs (approximate)
    const bondReg = Math.round(loanAmount * 0.015 + 5000)
    
    setTransferCosts(Math.round(transfer + bondReg))
  }

  if (priceType === 'rent') return null

  return (
    <div className="bg-white border border-stone-300 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex justify-between items-center hover:bg-stone-50 transition">
        <div className="flex items-center gap-3">
          <span className="text-xl">🏦</span>
          <div className="text-left">
            <p className="font-bold text-sm">Bond Calculator</p>
            {!open && monthly > 0 && (
              <p className="text-orange-500 text-xs">~R {monthly.toLocaleString()}/month</p>
            )}
          </div>
        </div>
        <span className="text-stone-500">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-stone-300 pt-4">
          {/* Deposit slider */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-stone-500 text-xs">Deposit</label>
              <span className="text-orange-500 text-xs font-bold">{deposit}% — R {(price * deposit / 100).toLocaleString()}</span>
            </div>
            <input type="range" min="0" max="50" value={deposit}
              onChange={e => setDeposit(Number(e.target.value))}
              className="w-full accent-orange-500"/>
          </div>

          {/* Interest rate */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-stone-500 text-xs">Interest Rate</label>
              <span className="text-orange-500 text-xs font-bold">{rate}%</span>
            </div>
            <input type="range" min="8" max="16" step="0.25" value={rate}
              onChange={e => setRate(Number(e.target.value))}
              className="w-full accent-orange-500"/>
          </div>

          {/* Term */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-stone-500 text-xs">Loan Term</label>
              <span className="text-orange-500 text-xs font-bold">{term} years</span>
            </div>
            <input type="range" min="5" max="30" step="5" value={term}
              onChange={e => setTerm(Number(e.target.value))}
              className="w-full accent-orange-500"/>
          </div>

          {/* Results */}
          <div className="bg-amber-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-stone-500 text-sm">Loan amount</span>
              <span className="font-bold">R {(price * (1 - deposit/100)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500 text-sm">Monthly repayment</span>
              <span className="font-bold text-orange-500 text-lg">R {monthly.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500 text-sm">Total repayment</span>
              <span className="font-bold">R {totalCost.toLocaleString()}</span>
            </div>
            <div className="border-t border-stone-300 pt-2 flex justify-between">
              <span className="text-stone-500 text-sm">Est. transfer + bond costs</span>
              <span className="font-bold text-yellow-400">R {transferCosts.toLocaleString()}</span>
            </div>
          </div>

          <p className="text-stone-400 text-xs text-center">
            Indicative only. Speak to a bond originator for accurate figures.
            <br/>Current prime rate: 11.75% | Transfer duty as per SARS 2024
          </p>
        </div>
      )}
    </div>
  )
}
