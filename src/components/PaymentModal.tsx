import { useState, useEffect } from 'react';
import {
  X, Smartphone, CreditCard, Banknote, Building, Check,
  Loader2, Phone, AlertCircle, RefreshCw, ArrowRight
} from 'lucide-react';
import { paymentApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const fmt = (n: number, currency = 'KES') =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

const PAYMENT_METHODS = [
  { id: 'mpesa', label: 'M-Pesa', icon: Smartphone, color: '#00A651', desc: 'STK Push to phone' },
  { id: 'credit_card', label: 'Card', icon: CreditCard, color: '#89b4fa', desc: 'Visa / Mastercard' },
  { id: 'cash', label: 'Cash', icon: Banknote, color: '#a6e3a1', desc: 'Physical currency' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: Building, color: '#fab387', desc: 'Direct transfer' },
];

type PaymentStep = 'select' | 'mpesa-phone' | 'mpesa-waiting' | 'card' | 'cash' | 'success';

interface PaymentModalProps {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ order, onClose, onSuccess }: PaymentModalProps) {
  const { user } = useAuthStore();
  const currency = user?.currency || 'KES';
  const [step, setStep] = useState<PaymentStep>('select');
  const [method, setMethod] = useState<string>('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [cashTendered, setCashTendered] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [polling, setPolling] = useState(false);
  const [change, setChange] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = Number(order.total_amount);

  // Poll M-Pesa status
  useEffect(() => {
    if (step !== 'mpesa-waiting' || !paymentId) return;

    const interval = setInterval(async () => {
      try {
        const res: any = await paymentApi.checkMpesaStatus(paymentId);
        if (res.data?.status === 'completed') {
          clearInterval(interval);
          setStep('success');
          setTimeout(onSuccess, 2000);
        } else if (res.data?.status === 'failed') {
          clearInterval(interval);
          setError('Payment failed or cancelled');
          setStep('mpesa-phone');
        }
      } catch { /* ignore */ }
    }, 3000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setError('Payment timeout. Please try again.');
      setStep('mpesa-phone');
    }, 120000);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [step, paymentId]);

  const handleMpesaSubmit = async () => {
    if (!mpesaPhone) { setError('Enter phone number'); return; }
    setLoading(true);
    setError('');
    try {
      const res: any = await paymentApi.mpesaSTKPush({
        order_id: order.id,
        phone: mpesaPhone,
        amount: total,
      });
      setPaymentId(res.data.payment_id);
      setStep('mpesa-waiting');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'M-Pesa request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCashSubmit = async () => {
    const tendered = parseFloat(cashTendered);
    if (!tendered || tendered < total) { setError('Amount must be ≥ total'); return; }
    setLoading(true);
    try {
      await paymentApi.processCash({ order_id: order.id, amount: total, amount_tendered: tendered, payment_method: 'cash' });
      setChange(tendered - total);
      setStep('success');
      setTimeout(onSuccess, 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Cash payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBankTransfer = async () => {
    setLoading(true);
    try {
      await paymentApi.processCash({ order_id: order.id, amount: total, amount_tendered: total, payment_method: 'bank_transfer' });
      setStep('success');
      setTimeout(onSuccess, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 460, padding: 0 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              {step === 'success' ? '✅ Payment Complete' : 'Process Payment'}
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text-subtext)', marginTop: 2 }}>
              Order #{order.order_number}
            </div>
          </div>
          {step !== 'success' && (
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Amount banner */}
        <div style={{
          padding: '1rem 1.5rem',
          background: 'rgba(137, 180, 250, 0.06)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-subtext)' }}>Amount Due</span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 28, fontWeight: 800, color: 'var(--accent-blue)' }}>
            {fmt(total, currency)}
          </span>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0.75rem 1rem', marginBottom: '1rem',
              background: 'rgba(243, 139, 168, 0.1)',
              border: '1px solid rgba(243, 139, 168, 0.3)',
              borderRadius: 10, fontSize: 13, color: 'var(--accent-red)',
            }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* Step: Select method */}
          {step === 'select' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {PAYMENT_METHODS.map(({ id, label, icon: Icon, color, desc }) => (
                <button
                  key={id}
                  onClick={() => {
                    setMethod(id);
                    if (id === 'mpesa') setStep('mpesa-phone');
                    else if (id === 'credit_card') setStep('card');
                    else if (id === 'cash') setStep('cash');
                    else if (id === 'bank_transfer') { setMethod('bank_transfer'); handleBankTransfer(); }
                  }}
                  style={{
                    padding: '1.25rem',
                    background: 'var(--bg-surface0)',
                    border: `1px solid var(--border)`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = color;
                    (e.currentTarget as HTMLElement).style.background = `${color}10`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface0)';
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={22} color={color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-subtext)' }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* M-Pesa phone entry */}
          {step === 'mpesa-phone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 18,
                  background: 'rgba(0, 166, 81, 0.15)',
                  margin: '0 auto 1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Smartphone size={32} color="#00A651" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  M-Pesa STK Push
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-subtext)' }}>
                  Enter the customer's M-Pesa number
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Phone Number
                </label>
                <div className="input-group">
                  <Phone size={16} className="input-icon" />
                  <input
                    className="input"
                    type="tel"
                    placeholder="0712345678 or 254712345678"
                    value={mpesaPhone}
                    onChange={e => setMpesaPhone(e.target.value)}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleMpesaSubmit()}
                    style={{ fontSize: 16, letterSpacing: 1 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setStep('select')}>
                  Back
                </button>
                <button
                  className="btn btn-lg"
                  style={{ flex: 2, background: '#00A651', color: 'white' }}
                  onClick={handleMpesaSubmit}
                  disabled={loading}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <><Smartphone size={18} /> Send STK Push</>}
                </button>
              </div>
            </div>
          )}

          {/* M-Pesa waiting */}
          {step === 'mpesa-waiting' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'rgba(0, 166, 81, 0.15)',
                margin: '0 auto 1.25rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div className="animate-pulse">
                  <Smartphone size={36} color="#00A651" />
                </div>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Waiting for Payment</h3>
              <p style={{ color: 'var(--text-subtext)', fontSize: 13, marginBottom: '1.5rem', lineHeight: 1.6 }}>
                STK Push sent to <strong style={{ color: 'var(--text-primary)' }}>{mpesaPhone}</strong>
                <br />Ask customer to enter M-Pesa PIN
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: 'var(--text-subtext)' }}>
                <RefreshCw size={14} className="animate-spin" />
                Checking status automatically...
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: '1.25rem' }}
                onClick={() => setStep('mpesa-phone')}
              >
                Cancel & retry
              </button>
            </div>
          )}

          {/* Cash payment */}
          {step === 'cash' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 18,
                  background: 'rgba(166, 227, 161, 0.15)',
                  margin: '0 auto 1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Banknote size={32} color="var(--accent-green)" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Cash Payment</h3>
              </div>

              {/* Quick amounts */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Quick amounts
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[total, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, 1000, 2000, 5000]
                    .filter((v, i, arr) => v >= total && arr.indexOf(v) === i)
                    .slice(0, 5)
                    .map(amount => (
                      <button
                        key={amount}
                        className="btn btn-secondary btn-sm"
                        onClick={() => setCashTendered(String(amount))}
                        style={{ fontFamily: 'DM Mono, monospace' }}
                      >
                        {amount.toLocaleString()}
                      </button>
                    ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Amount Tendered
                </label>
                <input
                  className="input"
                  type="number"
                  placeholder={`Min: ${total}`}
                  value={cashTendered}
                  onChange={e => setCashTendered(e.target.value)}
                  style={{ fontSize: 20, fontFamily: 'DM Mono, monospace', textAlign: 'center' }}
                  autoFocus
                />
              </div>

              {cashTendered && parseFloat(cashTendered) >= total && (
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(166, 227, 161, 0.1)',
                  border: '1px solid rgba(166, 227, 161, 0.3)',
                  borderRadius: 10,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 12, color: 'var(--text-subtext)' }}>Change to return</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 24, fontWeight: 800, color: 'var(--accent-green)' }}>
                    {fmt(parseFloat(cashTendered) - total, currency)}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setStep('select')}>Back</button>
                <button
                  className="btn btn-success btn-lg"
                  style={{ flex: 2 }}
                  onClick={handleCashSubmit}
                  disabled={loading || !cashTendered || parseFloat(cashTendered) < total}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> Confirm Cash</>}
                </button>
              </div>
            </div>
          )}

          {/* Card payment */}
          {step === 'card' && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: 'rgba(137, 180, 250, 0.15)',
                margin: '0 auto 1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CreditCard size={32} color="var(--accent-blue)" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Card Payment</h3>
              <p style={{ color: 'var(--text-subtext)', fontSize: 13, marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Stripe integration ready. Configure your Stripe keys in settings to accept card payments.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setStep('select')}>Back</button>
                <button
                  className="btn btn-primary btn-lg"
                  style={{ flex: 2 }}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await paymentApi.processCash({ order_id: order.id, amount: total, amount_tendered: total, payment_method: 'credit_card' });
                      setStep('success');
                      setTimeout(onSuccess, 2000);
                    } catch (err: any) {
                      setError(err?.response?.data?.message || 'Card payment failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <><CreditCard size={18} /> Process Card</>}
                </button>
              </div>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(166, 227, 161, 0.2)',
                margin: '0 auto 1.25rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'scaleIn 0.3s ease',
              }}>
                <Check size={36} color="var(--accent-green)" strokeWidth={3} />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-green)', marginBottom: 6 }}>
                Payment Successful!
              </h3>
              <p style={{ color: 'var(--text-subtext)', fontSize: 13 }}>
                {fmt(total, currency)} received
              </p>
              {change > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(249, 226, 175, 0.1)', border: '1px solid rgba(249, 226, 175, 0.3)', borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: 'var(--accent-yellow)' }}>Return change</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 24, fontWeight: 800, color: 'var(--accent-yellow)' }}>
                    {fmt(change, currency)}
                  </div>
                </div>
              )}
              <div style={{ marginTop: '1rem', fontSize: 12, color: 'var(--text-subtext)' }}>
                Closing automatically...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
