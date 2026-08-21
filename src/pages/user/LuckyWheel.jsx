import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLuckyWheelStatus, spinLuckyWheel } from '../../api/luckyWheel.api';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Gift, Copy, Check, Truck, X } from 'lucide-react';
import './LuckyWheel.css';

// Using mock prizes for the frontend wheel segments
const SEGMENTS = [
  { id: 'better-luck', label: 'better-luck', color: '#ffffff', textColor: '#718096', icon: <X size={20} /> },
  { id: '10-off', label: '10 OFF', color: '#e0dcfc', textColor: '#5a46e6', icon: <Gift size={20} /> },
  { id: '20-off', label: '20 OFF', color: '#ffecec', textColor: '#a0aec0', icon: <Gift size={20} /> },
  { id: '30-off', label: '30-off', color: '#ffffff', textColor: '#718096', icon: <Gift size={20} /> },
  { id: '40-off', label: '40 OFF', color: '#e0dcfc', textColor: '#5a46e6', icon: <Gift size={20} /> },
  { id: '50-off', label: '50-off', color: '#ffecec', textColor: '#a0aec0', icon: <Gift size={20} /> },
];

export default function LuckyWheel() {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [canSpin, setCanSpin] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const wheelRef = useRef(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const { data } = await getLuckyWheelStatus();
      if (data.success) {
        setCanSpin(data.data.canSpin);
        setResult(data.data.result);
        
        // If already spun, set initial rotation to the winning segment so it looks correct
        if (!data.data.canSpin && data.data.result) {
          const targetIndex = SEGMENTS.findIndex(s => s.id === data.data.result.prizeId);
          const finalIndex = targetIndex !== -1 ? targetIndex : 0;
          const segmentAngle = 360 / SEGMENTS.length;
          const centerOffset = segmentAngle / 2;
          
          const targetAngle = 360 - (finalIndex * segmentAngle + centerOffset);
          setRotation(targetAngle);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load Lucky Wheel status');
    } finally {
      setLoading(false);
    }
  };

  const handleSpin = async () => {
    if (isSpinning || !canSpin) return;
    
    setIsSpinning(true);
    
    try {
      const { data } = await spinLuckyWheel();
      
      if (data.success) {
        setCanSpin(false); // Disable future spins
        
        const wonPrizeId = data.data.result.prizeId;
        const targetIndex = SEGMENTS.findIndex(s => s.id === wonPrizeId);
        
        // If somehow the prize isn't in our mock frontend list, default to a random one just for visual
        const finalIndex = targetIndex !== -1 ? targetIndex : 0;
        
        // Calculate rotation
        const segmentAngle = 360 / SEGMENTS.length;
        const centerOffset = segmentAngle / 2;
        const baseSpins = 5 * 360; // 5 full rotations
        
        // Target angle to bring this segment's center to the top (0 degrees)
        const targetAngle = 360 - (finalIndex * segmentAngle + centerOffset);
        
        // Calculate the exact rotation amount to add, ensuring we always spin forward
        const currentMod = rotation % 360;
        let extraAngle = targetAngle - currentMod;
        if (extraAngle < 0) extraAngle += 360;
        
        // Add random offset within the segment so it doesn't land exactly on the line
        const randomOffset = Math.floor(Math.random() * (segmentAngle * 0.8)) - (segmentAngle * 0.4);
        
        const finalRotation = rotation + baseSpins + extraAngle + randomOffset;
        setRotation(finalRotation);
        
        // Wait for animation to finish (e.g., 4s as defined in CSS transition)
        setTimeout(() => {
          setResult(data.data.result);
          setIsSpinning(false);
        }, 4000);
      }
    } catch (err) {
      setIsSpinning(false);
      const status = err.response?.status;
      const message = err.response?.data?.message || 'Spin failed';
      
      if (status === 409) {
        // Already spun
        toast.error(message);
        setCanSpin(false);
        fetchStatus(); // re-sync
      } else {
        toast.error(message);
      }
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Coupon code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="home-dashboard page animate-fade-in" style={{ paddingBottom: '96px', background: '#fcfcfc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ borderTopColor: '#4A35E8', width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  return (
    <div className="home-dashboard page animate-fade-in" style={{ paddingBottom: '96px', background: '#fcfcfc', minHeight: '100vh' }}>
      
      {/* Header Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }} className="animate-slide-up">
        <button 
          className="circle-icon-btn hover-scale" 
          onClick={() => navigate(-1)}
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111111' }}
        >
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#718096' }}>
          Back
        </span>
      </div>

      <div className="animate-slide-up delay-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 850, color: '#1a202c', margin: '0 0 8px 0' }}>
          Spin & Win!
        </h1>
        <p style={{ color: '#4a5568', fontSize: '0.95rem', maxWidth: '300px' }}>Stand a chance to win exciting rewards</p>
      </div>

      <div className="lucky-wheel-container animate-scale-in delay-2">
        
        {/* The Wheel */}
        <div className="wheel-outer-wrapper">
          <div className="wheel-pointer">
            <div className="pointer-pin"></div>
          </div>
          
          <div className="wheel-wrapper">
            {/* Border Dots */}
            <div className="wheel-dots">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="wheel-dot-container" style={{ transform: `rotate(${i * 30}deg)` }}>
                  <div className="dot"></div>
                </div>
              ))}
            </div>

            <div 
              className="wheel" 
              ref={wheelRef}
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none' 
              }}
            >
              {/* Background Segments */}
              {SEGMENTS.map((segment, index) => {
                const rotateAngle = index * (360 / SEGMENTS.length);
                const skewY = 90 - (360 / SEGMENTS.length);
                return (
                  <div 
                    key={`bg-${segment.id}`}
                    className="wheel-segment-bg"
                    style={{
                      transform: `rotate(${rotateAngle}deg) skewY(-${skewY}deg)`,
                      backgroundColor: segment.color
                    }}
                  />
                );
              })}

              {/* Content Segments */}
              {SEGMENTS.map((segment, index) => {
                const centerAngle = index * (360 / SEGMENTS.length) + (360 / SEGMENTS.length / 2);
                return (
                  <div 
                    key={`content-${segment.id}`}
                    className="wheel-content-wrapper"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${centerAngle}deg)`
                    }}
                  >
                    <div className="segment-inner" style={{ color: segment.textColor }}>
                      {segment.icon}
                      <span className="segment-text">{segment.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Center Pivot */}
            <div className="wheel-center">
              <Gift size={26} color="#ffffff" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Action / Result Area */}
        <div className="lucky-wheel-action">
          {isSpinning || canSpin ? (
            <div className="pre-spin-container">
              <p className="pre-spin-text">Spin the wheel and win amazing rewards!</p>
              <button 
                className="spin-btn hover-scale"
                onClick={handleSpin}
                disabled={isSpinning}
              >
                {isSpinning ? 'Spinning...' : 'Spin Now'}
              </button>
              {!isSpinning && (
                <button className="maybe-later-btn" onClick={() => navigate(-1)}>
                  Maybe later
                </button>
              )}
            </div>
          ) : (
            <div className="result-card animate-slide-up">
              {result?.coupon ? (
                <>
                  <div className="result-icon-wrapper">
                    <Gift size={32} color="#06c169" />
                  </div>
                  <h3>You Won!</h3>
                  <p className="prize-text">{result.prize}</p>
                  
                  <div className="coupon-code-box">
                    <span className="code-badge">Personal Coupon</span>
                    <div className="code-display">
                      <span className="code-text">{result.coupon.code}</span>
                      <button 
                        onClick={() => handleCopyCode(result.coupon.code)}
                        className="copy-btn"
                        title="Copy Code"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <p className="helper-text">You can find this coupon in your profile later.</p>
                </>
              ) : (
                <>
                  <div className="result-icon-wrapper" style={{ background: '#f8fafc', color: '#718096' }}>
                    <Gift size={32} />
                  </div>
                  <h3>Oops!</h3>
                  <p className="prize-text" style={{ color: '#718096' }}>No reward this time.</p>
                  <p className="helper-text">Better luck next time!</p>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
