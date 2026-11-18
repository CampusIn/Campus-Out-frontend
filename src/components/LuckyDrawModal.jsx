import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Trophy, Sparkles, Clock, X, Phone, User, AlertCircle, PartyPopper } from 'lucide-react';
import { confetti } from './Confetti';
import { submitLuckyDrawEntry, getUserLuckyDrawWinners } from '../api/luckyDraw.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LuckyDrawModal({ isOpen, onClose, drawStatus, onEntrySubmitted }) {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('enter'); // 'enter' | 'winners'
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [entrySuccess, setEntrySuccess] = useState(null);
  const [alreadyEntered, setAlreadyEntered] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Winners state
  const [winnersData, setWinnersData] = useState(null);
  const [loadingWinners, setLoadingWinners] = useState(false);

  // Time remaining countdown
  const [timeRemaining, setTimeRemaining] = useState('');

  // Pre-fill user information when opening
  useEffect(() => {
    if (isOpen) {
      if (user?.username) {
        setName(user.username);
      }
      setErrorMessage('');
      setEntrySuccess(null);
      setAlreadyEntered(false);

      // Check localStorage if this user already entered this draw
      if (drawStatus?.luckyDrawId) {
        const storedEntry = localStorage.getItem(`lucky_entry_${drawStatus.luckyDrawId}_${user?.id || 'anon'}`);
        if (storedEntry) {
          try {
            setEntrySuccess(JSON.parse(storedEntry));
            setAlreadyEntered(true);
          } catch (e) {
            // ignore
          }
        }
      }

      // If draw is already over, default to winners tab
      if (drawStatus?.isOver && !drawStatus?.canSubmit) {
        setActiveTab('winners');
      } else {
        setActiveTab('enter');
      }
    }
  }, [isOpen, user, drawStatus]);

  // Calculate countdown
  useEffect(() => {
    if (!drawStatus?.submissionDeadline) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const deadline = new Date(drawStatus.submissionDeadline).getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeRemaining('Submission period ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m left`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s left`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s left`);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [drawStatus?.submissionDeadline]);

  // Fetch Winners list
  const fetchWinners = useCallback(async () => {
    setLoadingWinners(true);
    try {
      const { data } = await getUserLuckyDrawWinners(
        drawStatus?.luckyDrawId ? { luckyDrawId: drawStatus.luckyDrawId } : undefined
      );
      if (data.success) {
        setWinnersData(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch lucky draw winners:', err);
    } finally {
      setLoadingWinners(false);
    }
  }, [drawStatus?.luckyDrawId]);

  useEffect(() => {
    if (isOpen && activeTab === 'winners') {
      fetchWinners();
    }
  }, [isOpen, activeTab, fetchWinners]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = name.trim();
    const cleanMobile = mobileNumber.trim().replace(/[\s\-()]/g, '');

    if (cleanName.length < 2) {
      setErrorMessage('Please enter a valid full name (at least 2 letters)');
      return;
    }

    if (!/^\+?[0-9]{10,15}$/.test(cleanMobile)) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await submitLuckyDrawEntry({
        name: cleanName,
        mobileNumber: cleanMobile
      });

      if (data.success) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        toast.success('Congratulations! Your lucky draw entry was submitted.');
        const resultData = data.data;
        setEntrySuccess(resultData);
        setAlreadyEntered(true);
        if (drawStatus?.luckyDrawId) {
          localStorage.setItem(`lucky_entry_${drawStatus.luckyDrawId}_${user?.id || 'anon'}`, JSON.stringify(resultData));
        }
        if (onEntrySubmitted) onEntrySubmitted();
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Failed to submit lucky draw entry';

      if (status === 409) {
        setAlreadyEntered(true);
        setErrorMessage('You or this mobile number is already registered in this lucky draw!');
        toast.info('You have already submitted an entry for this lucky draw.');
      } else {
        setErrorMessage(msg);
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '480px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(74, 53, 232, 0.25)',
            border: '1.5px solid #edf2f7',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}
        >
          {/* Top Decorative Header */}
          <div 
            style={{
              background: '#4A35E8',
              padding: '24px 24px 20px 24px',
              color: '#ffffff',
              position: 'relative'
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.2s'
              }}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div 
                style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  borderRadius: '12px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(4px)'
                }}
              >
                <Gift size={22} color="#ffffff" />
              </div>
              <div>
                <span 
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    background: 'rgba(255, 255, 255, 0.25)',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    display: 'inline-block'
                  }}
                >
                  Campus Exclusive
                </span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '4px 0 0 0', lineHeight: 1.2 }}>
                  {drawStatus?.title || 'Lucky Winner Draw'}
                </h2>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.92)', margin: 0, lineHeight: 1.4 }}>
              {drawStatus?.description || 'Participate for a chance to win exciting prizes!'}
            </p>

            {/* Sub-info Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
              {timeRemaining && drawStatus?.canSubmit && (
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(0, 0, 0, 0.22)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}
                >
                  <Clock size={13} />
                  <span>{timeRemaining}</span>
                </div>
              )}

              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                <Sparkles size={13} />
                <span>100% Free Entry</span>
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div 
            style={{
              display: 'flex',
              borderBottom: '1.5px solid #f1f5f9',
              background: '#fafafa',
              padding: '4px 8px 0 8px'
            }}
          >
            <button
              onClick={() => setActiveTab('enter')}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: 750,
                fontSize: '0.88rem',
                color: activeTab === 'enter' ? '#4A35E8' : '#64748b',
                borderBottom: activeTab === 'enter' ? '2.5px solid #4A35E8' : '2.5px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Gift size={16} />
              <span>{drawStatus?.isOver ? 'Draw Status' : 'Enter Draw'}</span>
            </button>

            <button
              onClick={() => setActiveTab('winners')}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: 750,
                fontSize: '0.88rem',
                color: activeTab === 'winners' ? '#4A35E8' : '#64748b',
                borderBottom: activeTab === 'winners' ? '2.5px solid #4A35E8' : '2.5px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Trophy size={16} />
              <span>Winner Wall</span>
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
            {activeTab === 'enter' && (
              <div>
                {/* Condition 1: Draw is over */}
                {drawStatus?.isOver ? (
                  <div style={{ textAlign: 'center', padding: '20px 8px' }}>
                    <div 
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: '#fef3c7',
                        color: '#d97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px auto'
                      }}
                    >
                      <Trophy size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                      This Lucky Draw is Concluded!
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '340px', margin: '0 auto 18px auto', lineHeight: 1.5 }}>
                      Winners have already been selected using cryptographic randomization. Check the winners wall to see who won!
                    </p>
                    <button
                      onClick={() => setActiveTab('winners')}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#4A35E8',
                        color: '#ffffff',
                        fontWeight: 750,
                        fontSize: '0.88rem',
                        cursor: 'pointer'
                      }}
                    >
                      View Winner Wall
                    </button>
                  </div>
                ) : !drawStatus?.isActive && !drawStatus?.canSubmit ? (
                  /* Condition 2: No active draw */
                  <div style={{ textAlign: 'center', padding: '24px 8px' }}>
                    <div 
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: '#f1f5f9',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px auto'
                      }}
                    >
                      <Clock size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                      No Active Draw Right Now
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '340px', margin: '0 auto 18px auto', lineHeight: 1.5 }}>
                      The next round of Campus Lucky Draw will be announced soon. Keep exploring the marketplace!
                    </p>
                    <button
                      onClick={onClose}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '12px',
                        border: '1.5px solid #e2e8f0',
                        background: '#ffffff',
                        color: '#475569',
                        fontWeight: 750,
                        fontSize: '0.88rem',
                        cursor: 'pointer'
                      }}
                    >
                      Back to Marketplace
                    </button>
                  </div>
                ) : entrySuccess || alreadyEntered ? (
                  /* Condition 3: Successfully submitted or already entered */
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: 'center', padding: '16px 8px' }}
                  >
                    <div 
                      style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '50%',
                        background: '#dcfce7',
                        color: '#15803d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px auto',
                        boxShadow: '0 8px 16px rgba(21, 128, 61, 0.15)'
                      }}
                    >
                      <PartyPopper size={34} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d', marginBottom: '6px' }}>
                      You're in the Draw! 🎉
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: '#475569', maxWidth: '360px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                      Your entry has been securely registered. Winners will be announced directly on this page after the deadline.
                    </p>

                    {entrySuccess?.submittedAt && (
                      <div 
                        style={{
                          background: '#f8fafc',
                          border: '1.5px dashed #cbd5e1',
                          borderRadius: '16px',
                          padding: '14px 18px',
                          marginBottom: '20px',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                          <span style={{ color: '#64748b' }}>Participant Name:</span>
                          <span style={{ fontWeight: 750, color: '#1e293b' }}>{entrySuccess.name || name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                          <span style={{ color: '#64748b' }}>Submitted On:</span>
                          <span style={{ fontWeight: 650, color: '#1e293b' }}>
                            {new Date(entrySuccess.submittedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setActiveTab('winners')}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '12px',
                          border: '1.5px solid #e2e8f0',
                          background: '#ffffff',
                          color: '#1e293b',
                          fontWeight: 750,
                          fontSize: '0.88rem',
                          cursor: 'pointer'
                        }}
                      >
                        Check Winners
                      </button>
                      <button
                        onClick={onClose}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '12px',
                          border: 'none',
                          background: '#4A35E8',
                          color: '#ffffff',
                          fontWeight: 750,
                          fontSize: '0.88rem',
                          cursor: 'pointer'
                        }}
                      >
                        Awesome, Got It!
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Condition 4: Entry form */
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4A35E8', fontSize: '0.85rem', fontWeight: 700 }}>
                      <Sparkles size={16} />
                      <span>Enter your details for the live draw:</span>
                    </div>

                    {errorMessage && (
                      <div 
                        style={{
                          background: '#fee2e2',
                          border: '1px solid #fecaca',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          color: '#b91c1c',
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <div>
                      <label 
                        style={{
                          display: 'block',
                          fontSize: '0.82rem',
                          fontWeight: 750,
                          color: '#334155',
                          marginBottom: '6px'
                        }}
                      >
                        Full Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User 
                          size={17} 
                          color="#94a3b8" 
                          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
                        />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rahul Sharma"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          style={{
                            width: '100%',
                            height: '44px',
                            padding: '0 12px 0 38px',
                            borderRadius: '12px',
                            border: '1.5px solid #e2e8f0',
                            fontSize: '0.9rem',
                            outline: 'none',
                            fontWeight: 600,
                            color: '#1e293b',
                            background: '#f8fafc',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#4A35E8'}
                          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
                    </div>

                    <div>
                      <label 
                        style={{
                          display: 'block',
                          fontSize: '0.82rem',
                          fontWeight: 750,
                          color: '#334155',
                          marginBottom: '6px'
                        }}
                      >
                        Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Phone 
                          size={17} 
                          color="#94a3b8" 
                          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
                        />
                        <input
                          type="tel"
                          required
                          placeholder="10-digit mobile number"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          maxLength={15}
                          style={{
                            width: '100%',
                            height: '44px',
                            padding: '0 12px 0 38px',
                            borderRadius: '12px',
                            border: '1.5px solid #e2e8f0',
                            fontSize: '0.9rem',
                            outline: 'none',
                            fontWeight: 600,
                            color: '#1e293b',
                            background: '#f8fafc',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#4A35E8'}
                          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                        Used only to contact you if you win. Kept strictly private.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        height: '46px',
                        background: '#4A35E8',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '14px',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 8px 20px rgba(74, 53, 232, 0.3)',
                        transition: 'all 0.2s',
                        marginTop: '6px'
                      }}
                    >
                      {submitting ? (
                        <span>Submitting Entry...</span>
                      ) : (
                        <>
                          <Gift size={18} />
                          <span>Submit My Lucky Draw Entry</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'winners' && (
              <div>
                {loadingWinners ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                    <div className="spinner" style={{ margin: '0 auto 12px auto' }}></div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 650 }}>Loading Winner Wall...</p>
                  </div>
                ) : winnersData?.isOver && winnersData?.winners?.length > 0 ? (
                  <div>
                    <div 
                      style={{
                        background: '#fffbeb',
                        border: '1.5px solid #fde68a',
                        borderRadius: '16px',
                        padding: '16px',
                        textAlign: 'center',
                        marginBottom: '16px'
                      }}
                    >
                      <Trophy size={28} color="#d97706" style={{ margin: '0 auto 6px auto' }} />
                      <h4 style={{ margin: '0 0 4px 0', color: '#92400e', fontWeight: 800, fontSize: '1rem' }}>
                        🎉 Congratulations to Our Winners!
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#b45309' }}>
                        Drawn on {new Date(winnersData.drawnAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {winnersData.winners.map((winner, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: '#ffffff',
                            border: '1.5px solid #f1f5f9',
                            borderRadius: '14px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div 
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: idx === 0 ? '#fef3c7' : '#f1f5f9',
                                color: idx === 0 ? '#d97706' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.85rem'
                              }}
                            >
                              {idx + 1}
                            </div>
                            <span style={{ fontWeight: 750, color: '#1e293b', fontSize: '0.92rem' }}>
                              {winner.name}
                            </span>
                          </div>
                          <span 
                            style={{
                              background: '#ecfdf5',
                              color: '#059669',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 750
                            }}
                          >
                            Winner
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                    <div 
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#f1f5f9',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px auto'
                      }}
                    >
                      <Trophy size={28} />
                    </div>
                    <h4 style={{ margin: '0 0 6px 0', color: '#1e293b', fontWeight: 800 }}>
                      No Winners Drawn Yet
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                      Winners will be revealed right here once the lucky draw is conducted!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
