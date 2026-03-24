import { useState } from 'react';
import { X, Smartphone, CreditCard, Banknote, Building2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { paymentsApi, ordersApi } from '../../api/client';
import { useCartStore, useAuthStore } from '../../store';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface Props {
  total: number;
  orderId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentMethod = 'mpesa' | 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer';
type Stage = 'select' | 'details' | 'processing' | 'success' | 'failed';

const paymentMethods = [
  { id: 'mpesa', label: 'M-Pesa', icon: Smartphone, color: '#22c55e', desc: 'STK Push to phone' },
  { id: 'credit_card', label: 'Credit Card', icon: CreditCard, color: '#3b82f6', desc: 'Visa / Mastercard' },
  { id: 'debit_card', label: 'Debit Card', icon: CreditCard, color: '#8b5cf6', desc: 'Visa / Mastercard' },
  { id: 'cash', label: 'Cash', icon: Banknote, color: '#f59e0b', desc: 'Physical payment' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2, color: '#06b6d4', desc: 'Direct bank transfer' },
] as const;

export default function PaymentModal({ total, orderId: existingOrderId, onClose, onSuccess }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('mpesa');
  const [stage, setStage] = useState<Stage>('select');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [cashTendered, setCashTendered] = useState(total.toString());
  const [cardLast4, setCardLast4] = useState('');
  const [cardBrand, setCardBrand] = useState('visa');
  const [bankRef, setBankRef] = useState('');
  const [bankName, setBankName] = useState('');
  const [receipt, setReceipt] = useState('');
  const [change, setChange] = useState(0);
  const { user } = useAuthStore();
  const cart = useCartStore();
  const currency = user?.currency || 'KES';
  const fmt = (n: number) => `${currency} ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  const createOrder = async () => {
    const orderData = {
      items: cart.items,
      customer_id: cart.customer?.id,
      discount_amount: cart.getDiscount(),
      notes: cart.notes,
      tax_rate: user?.tax_rate || 16,
    };
    const res = await ordersApi.create(orderData);
    return res.data.id;
  };

  const processPayment = async () => {
    setStage('processing');
    try {
      const orderId = existingOrderId || await createOrder();

      if (method === 'mpesa') {
        const res = await paymentsApi.mpesaSTK({ orderId, phone: mpesaPhone, amount: total });
        setReceipt(res.data.receipt);
      } else if (method === 'credit_card' || method === 'debit_card') {
        await paymentsApi.card({ orderId, amount: total, cardLast4, cardBrand: method });
      } else if (method === 'cash') {
        const res = await paymentsApi.cash({ orderId, amount: total, amountTendered: Number(cashTendered) });
        setChange(res.data.change || 0);
      } else if (method === 'bank_transfer') {
        await paymentsApi.bankTransfer({ orderId, amount: total, reference: bankRef, bankName });
      }

      setStage('success');
      toast.success('Payment successful!');
    } catch (err: any) {
      setStage('failed');
      toast.error(err.response?.data?.error || 'Payment failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && stage !== 'processing' && onClose()}>
      <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-md shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-800">
          <div>
            <h2 className="text-xl font-bold text-white">Checkout</h2>
            <p className="text-2xl font-bold text-brand-400 number-display mt-1">{fmt(total)}</p>
          </div>
          {stage !== 'processing' && (
            <button onClick={onClose} className="text-dark-400 hover:text-white p-2 rounded-lg hover:bg-dark-800 transition-colors"><X size={20} /></button>
          )}
        </div>

        <div className="p-6">
          {/* Select method */}
          {(stage === 'select' || stage === 'details') && (
            <>
              <p className="text-xs text-dark-400 font-medium uppercase tracking-wider mb-3">Payment Method</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {paymentMethods.map(({ id, label, icon: Icon, color, desc }) => (
                  <button key={id} onClick={() => { setMethod(id as PaymentMethod); setStage('details'); }}
                    className={clsx('p-3 rounded-xl border text-left transition-all', method === id && stage === 'details' ? 'border-opacity-100 bg-opacity-10' : 'border-dark-700 hover:border-dark-600 bg-dark-800')}
                    style={method === id && stage === 'details' ? { borderColor: color, backgroundColor: `${color}15` } : {}}>
                    <Icon size={20} style={method === id ? { color } : { color: '#64748b' }} className="mb-2" />
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-dark-400">{desc}</p>
                  </button>
                ))}
              </div>

              {/* Payment details */}
              {stage === 'details' && (
                <div className="space-y-4 animate-slide-in">
                  {method === 'mpesa' && (
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">M-Pesa Phone Number</label>
                      <input value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} placeholder="0712345678 or +254712345678"
                        className="input-field w-full px-4 py-3 text-sm" />
                      <p className="text-xs text-dark-400 mt-1">An STK push will be sent to this number</p>
                    </div>
                  )}
                  {(method === 'credit_card' || method === 'debit_card') && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Card Last 4 Digits</label>
                        <input value={cardLast4} onChange={e => setCardLast4(e.target.value.slice(0,4))} placeholder="1234" maxLength={4}
                          className="input-field w-full px-4 py-3 text-sm font-mono tracking-widest" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Card Network</label>
                        <select value={cardBrand} onChange={e => setCardBrand(e.target.value)} className="input-field w-full px-4 py-3 text-sm">
                          <option value="visa">Visa</option>
                          <option value="mastercard">Mastercard</option>
                          <option value="amex">American Express</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {method === 'cash' && (
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Amount Tendered</label>
                      <input type="number" value={cashTendered} onChange={e => setCashTendered(e.target.value)} min={total}
                        className="input-field w-full px-4 py-3 text-sm number-display" />
                      {Number(cashTendered) >= total && (
                        <p className="text-sm text-brand-400 mt-1 number-display">Change: {fmt(Number(cashTendered) - total)}</p>
                      )}
                    </div>
                  )}
                  {method === 'bank_transfer' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Bank Name</label>
                        <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="KCB, Equity, NCBA..."
                          className="input-field w-full px-4 py-3 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Transaction Reference</label>
                        <input value={bankRef} onChange={e => setBankRef(e.target.value)} placeholder="Transfer reference number"
                          className="input-field w-full px-4 py-3 text-sm font-mono" />
                      </div>
                    </div>
                  )}
                  <button onClick={processPayment}
                    disabled={(method === 'mpesa' && !mpesaPhone) || (method === 'bank_transfer' && !bankRef)}
                    className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                    Confirm Payment — {fmt(total)}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Processing */}
          {stage === 'processing' && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="w-16 h-16 rounded-full border-2 border-brand-500/30 absolute animate-ping" />
                <div className="w-16 h-16 rounded-full border-2 border-brand-500 flex items-center justify-center">
                  <Loader2 size={24} className="text-brand-400 animate-spin" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Processing Payment</h3>
              {method === 'mpesa' && <p className="text-dark-400 text-sm">STK push sent to {mpesaPhone}<br />Please check your phone and enter your M-Pesa PIN</p>}
              {method !== 'mpesa' && <p className="text-dark-400 text-sm">Processing your payment...</p>}
            </div>
          )}

          {/* Success */}
          {stage === 'success' && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 bg-brand-500/15 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-brand-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Payment Successful!</h3>
              <p className="text-2xl font-bold text-brand-400 number-display mb-4">{fmt(total)}</p>
              {receipt && (
                <div className="bg-dark-800 rounded-lg p-3 mb-4">
                  <p className="text-xs text-dark-400">M-Pesa Receipt</p>
                  <p className="font-mono font-bold text-white">{receipt}</p>
                </div>
              )}
              {change > 0 && (
                <div className="bg-dark-800 rounded-lg p-3 mb-4">
                  <p className="text-xs text-dark-400">Change to give</p>
                  <p className="font-bold text-amber-400 text-xl number-display">{fmt(change)}</p>
                </div>
              )}
              <button onClick={onSuccess} className="btn-primary w-full py-3 text-sm font-semibold">
                New Transaction
              </button>
            </div>
          )}

          {/* Failed */}
          {stage === 'failed' && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/15 rounded-full flex items-center justify-center">
                <AlertCircle size={32} className="text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Payment Failed</h3>
              <p className="text-dark-400 text-sm mb-6">Something went wrong. Please try again.</p>
              <div className="flex gap-3">
                <button onClick={() => setStage('details')} className="btn-primary flex-1 py-3 text-sm">Try Again</button>
                <button onClick={onClose} className="btn-secondary flex-1 py-3 text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
