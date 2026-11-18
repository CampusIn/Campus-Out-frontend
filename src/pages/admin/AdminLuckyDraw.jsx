import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { confetti } from '../../components/Confetti';
import {
  getAdminLuckyDrawDetails,
  enableLuckyDraw,
  updateLuckyDrawDeadline,
  drawLuckyWinners,
  getAdminLuckyDrawParticipants
} from '../../api/luckyDraw.api';

import {
  Gift,
  Trophy,
  Users,
  Clock,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Edit,
  AlertCircle,
  Copy,
  Phone,
  X
} from 'lucide-react';

import './AdminPortal.css';

export default function AdminLuckyDraw() {
  const toast = useToast();

  // Draw details & summary
  const [drawDetails, setDrawDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Participants list & pagination
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [search, setSearch] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deadlineModalOpen, setDeadlineModalOpen] = useState(false);
  const [drawModalOpen, setDrawModalOpen] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    title: 'Campus Lucky Draw',
    description: 'Participate for a chance to win exciting prizes!',
    submissionDeadline: '',
    numberOfWinners: 1,
    closePrevious: true
  });
  const [deadlineForm, setDeadlineForm] = useState({
    submissionDeadline: ''
  });
  const [drawForm, setDrawForm] = useState({
    winnerCount: 1
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch Draw Details
  const fetchDetails = useCallback(async () => {
    setLoadingDetails(true);
    try {
      const { data } = await getAdminLuckyDrawDetails();
      if (data.success) {
        setDrawDetails(data.data);
        if (data.data?.numberOfWinners) {
          setDrawForm({ winnerCount: data.data.numberOfWinners });
        }
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error(err.response?.data?.message || 'Error fetching lucky draw details');
      } else {
        setDrawDetails(null);
      }
    } finally {
      setLoadingDetails(false);
    }
  }, [toast]);

  // Fetch Participants
  const fetchParticipants = useCallback(async () => {
    setLoadingParticipants(true);
    try {
      const { data } = await getAdminLuckyDrawParticipants({
        page,
        limit: 15,
        search: search.trim() || undefined
      });
      if (data.success) {
        setParticipants(data.data.participants || []);
        setTotalPages(data.data.totalPages || 1);
        setTotalParticipants(data.data.totalParticipants || 0);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error(err.response?.data?.message || 'Error fetching participants');
      } else {
        setParticipants([]);
        setTotalPages(1);
        setTotalParticipants(0);
      }
    } finally {
      setLoadingParticipants(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Handle Search Input
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Create Draw Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.submissionDeadline) {
      toast.error('Please select a valid future deadline date & time');
      return;
    }

    const deadline = new Date(createForm.submissionDeadline);
    if (deadline.getTime() <= Date.now()) {
      toast.error('Submission deadline must be in the future');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await enableLuckyDraw({
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        submissionDeadline: createForm.submissionDeadline,
        numberOfWinners: Number(createForm.numberOfWinners) || 1,
        closePrevious: createForm.closePrevious
      });

      if (data.success) {
        toast.success('Lucky draw launched successfully!');
        setCreateModalOpen(false);
        fetchDetails();
        fetchParticipants();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create lucky draw');
    } finally {
      setSubmitting(false);
    }
  };

  // Update Deadline Submit
  const handleDeadlineSubmit = async (e) => {
    e.preventDefault();
    if (!deadlineForm.submissionDeadline) {
      toast.error('Please select a valid future deadline');
      return;
    }

    const deadline = new Date(deadlineForm.submissionDeadline);
    if (deadline.getTime() <= Date.now()) {
      toast.error('New deadline must be in the future');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await updateLuckyDrawDeadline({
        luckyDrawId: drawDetails?.luckyDrawId,
        submissionDeadline: deadlineForm.submissionDeadline
      });

      if (data.success) {
        toast.success('Submission deadline updated successfully!');
        setDeadlineModalOpen(false);
        fetchDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update deadline');
    } finally {
      setSubmitting(false);
    }
  };

  // Conduct Lucky Draw Submit
  const handleDrawSubmit = async (e) => {
    e.preventDefault();
    const count = Number(drawForm.winnerCount);
    if (!count || count < 1) {
      toast.error('Please enter at least 1 winner');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await drawLuckyWinners({
        luckyDrawId: drawDetails?.luckyDrawId,
        winnerCount: count
      });

      if (data.success) {
        confetti({
          particleCount: 160,
          spread: 90,
          origin: { y: 0.5 }
        });
        toast.success(`🎉 ${data.data.totalWinners} Lucky Winner(s) selected successfully!`);
        setDrawModalOpen(false);
        fetchDetails();
        fetchParticipants();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to conduct lucky draw');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text, label = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  // Format Helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-portal-content animate-fade-in">
      {/* 1. Header Bar */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#f2efff',
                color: '#4A35E8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Gift size={22} />
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
              Lucky Winner Draw
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Create student lucky draw campaigns, monitor entries, and run cryptographic winner selection.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              fetchDetails();
              fetchParticipants();
            }}
            disabled={loadingDetails || loadingParticipants}
            className="hover-lift"
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1.5px solid #e2e8f0',
              background: '#ffffff',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} className={loadingDetails ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              // Set default deadline to tomorrow 6 PM
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(18, 0, 0, 0);
              const formattedDate = tomorrow.toISOString().slice(0, 16);

              setCreateForm({
                title: 'Campus Lucky Draw',
                description: 'Participate for a chance to win exciting prizes!',
                submissionDeadline: formattedDate,
                numberOfWinners: 1,
                closePrevious: true
              });
              setCreateModalOpen(true);
            }}
            className="hover-lift"
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: 'none',
              background: '#4A35E8',
              color: '#ffffff',
              fontWeight: 750,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(74, 53, 232, 0.25)'
            }}
          >
            <Plus size={16} />
            <span>New Lucky Draw</span>
          </button>
        </div>
      </div>

      {/* 2. Active Draw Overview Card */}
      {loadingDetails ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <div className="spinner" style={{ margin: '0 auto 12px auto' }}></div>
          <p style={{ fontWeight: 650 }}>Loading campaign overview...</p>
        </div>
      ) : !drawDetails ? (
        <div 
          className="card" 
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: '20px',
            border: '1.5px dashed #cbd5e1',
            marginBottom: '28px'
          }}
        >
          <div 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#f2efff',
              color: '#4A35E8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}
          >
            <Gift size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
            No Active Lucky Draw Found
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
            Create a new lucky draw campaign to allow students to participate from the marketplace and win exciting prizes.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: '#4A35E8',
              color: '#ffffff',
              fontWeight: 750,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={16} />
            <span>Launch First Lucky Draw</span>
          </button>
        </div>
      ) : (
        <div 
          className="card"
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #edf2f7',
            padding: '24px',
            marginBottom: '28px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)'
          }}
        >
          {/* Card Top Row */}
          <div 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '20px',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                  {drawDetails.title}
                </h2>
                <span 
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background: drawDetails.isOver 
                      ? '#f3e8ff' 
                      : drawDetails.isActive 
                        ? '#dcfce7' 
                        : '#fee2e2',
                    color: drawDetails.isOver 
                      ? '#7e22ce' 
                      : drawDetails.isActive 
                        ? '#15803d' 
                        : '#b91c1c'
                  }}
                >
                  {drawDetails.isOver ? 'COMPLETED' : drawDetails.status || 'ACTIVE'}
                </span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0, maxWidth: '600px' }}>
                {drawDetails.description || 'No description provided for this draw.'}
              </p>
            </div>

            {/* Quick action buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {!drawDetails.isOver && (
                <>
                  <button
                    onClick={() => {
                      const dt = new Date(drawDetails.submissionDeadline);
                      const formatted = !isNaN(dt.getTime()) ? dt.toISOString().slice(0, 16) : '';
                      setDeadlineForm({ submissionDeadline: formatted });
                      setDeadlineModalOpen(true);
                    }}
                    className="hover-lift"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit size={14} />
                    <span>Update Deadline</span>
                  </button>

                  <button
                    onClick={() => {
                      setDrawForm({ winnerCount: drawDetails.numberOfWinners || 1 });
                      setDrawModalOpen(true);
                    }}
                    disabled={drawDetails.totalParticipants === 0}
                    className="hover-lift"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: drawDetails.totalParticipants === 0 ? '#94a3b8' : 'linear-gradient(135deg, #7C3AED 0%, #4A35E8 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: drawDetails.totalParticipants === 0 ? 'not-allowed' : 'pointer',
                      boxShadow: drawDetails.totalParticipants === 0 ? 'none' : '0 4px 12px rgba(124, 58, 237, 0.3)'
                    }}
                  >
                    <Trophy size={14} />
                    <span>Pick Winners Now</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Metrics Grid */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}
          >
            <div 
              style={{
                background: '#f8fafc',
                borderRadius: '14px',
                padding: '16px',
                border: '1px solid #edf2f7'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                <Users size={16} color="#4A35E8" />
                <span>TOTAL PARTICIPANTS</span>
              </div>
              <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b' }}>
                {drawDetails.totalParticipants || 0}
              </span>
            </div>

            <div 
              style={{
                background: '#f8fafc',
                borderRadius: '14px',
                padding: '16px',
                border: '1px solid #edf2f7'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                <Trophy size={16} color="#d97706" />
                <span>TARGET WINNERS</span>
              </div>
              <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b' }}>
                {drawDetails.numberOfWinners || 1}
              </span>
            </div>

            <div 
              style={{
                background: '#f8fafc',
                borderRadius: '14px',
                padding: '16px',
                border: '1px solid #edf2f7'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                <Clock size={16} color="#059669" />
                <span>SUBMISSION DEADLINE</span>
              </div>
              <span style={{ fontSize: '0.95rem', fontWeight: 750, color: '#1e293b', display: 'block', marginTop: '4px' }}>
                {formatDate(drawDetails.submissionDeadline)}
              </span>
            </div>

            <div 
              style={{
                background: '#f8fafc',
                borderRadius: '14px',
                padding: '16px',
                border: '1px solid #edf2f7'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                <Sparkles size={16} color="#ec4899" />
                <span>DRAW STATUS</span>
              </div>
              <span style={{ fontSize: '0.95rem', fontWeight: 750, color: '#1e293b', display: 'block', marginTop: '4px' }}>
                {drawDetails.isOver 
                  ? `Drawn on ${formatDate(drawDetails.drawnAt)}`
                  : new Date(drawDetails.submissionDeadline).getTime() > Date.now()
                    ? 'Accepting entries'
                    : 'Deadline reached (Ready to draw)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Winners Showcase (If draw is over) */}
      {drawDetails?.isOver && drawDetails?.winners?.length > 0 && (
        <div 
          className="card"
          style={{
            background: 'linear-gradient(135deg, #fefce8 0%, #ffffff 100%)',
            borderRadius: '20px',
            border: '1.5px solid #fef08a',
            padding: '24px',
            marginBottom: '28px',
            boxShadow: '0 4px 15px rgba(234, 179, 8, 0.08)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#fef08a',
                  color: '#ca8a04',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Trophy size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#854d0e' }}>
                  Lucky Draw Winners ({drawDetails.winners.length})
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#a16207' }}>
                  Selected securely via cryptographic PRNG
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                const text = drawDetails.winners
                  .map((w, idx) => `${idx + 1}. ${w.name} - ${w.mobileNumber}`)
                  .join('\n');
                copyToClipboard(text, 'Winners contact list copied!');
              }}
              className="hover-lift"
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid #fde047',
                background: '#ffffff',
                color: '#854d0e',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Copy size={14} />
              <span>Copy All Contacts</span>
            </button>
          </div>

          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '14px'
            }}
          >
            {drawDetails.winners.map((winner, idx) => (
              <div 
                key={idx}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #fef08a',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div 
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#fef9c3',
                      color: '#a16207',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.9rem'
                    }}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                      {winner.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4A35E8', fontSize: '0.82rem', fontWeight: 700 }}>
                      <Phone size={12} />
                      <a href={`tel:${winner.mobileNumber}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {winner.mobileNumber}
                      </a>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(winner.mobileNumber, `Phone ${winner.mobileNumber} copied!`)}
                  title="Copy Phone Number"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '6px',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  <Copy size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Participants Table */}
      <div 
        className="card"
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #edf2f7',
          padding: '24px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', margin: '0 0 4px 0' }}>
              Participant Directory
            </h3>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Showing {participants.length} of {totalParticipants} total submissions
            </span>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search 
              size={16} 
              color="#94a3b8" 
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={handleSearchChange}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px 0 36px',
                borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                fontSize: '0.85rem',
                outline: 'none',
                background: '#f8fafc',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #f1f5f9', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 14px' }}>#</th>
                <th style={{ padding: '12px 14px' }}>Participant</th>
                <th style={{ padding: '12px 14px' }}>Mobile Number</th>
                <th style={{ padding: '12px 14px' }}>Submitted At</th>
                <th style={{ padding: '12px 14px' }}>Entry ID</th>
              </tr>
            </thead>
            <tbody>
              {loadingParticipants ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <div className="spinner" style={{ margin: '0 auto 10px auto' }}></div>
                    <span>Loading participants...</span>
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8' }}>
                    <Users size={32} style={{ margin: '0 auto 10px auto', display: 'block', opacity: 0.6 }} />
                    <p style={{ margin: 0, fontWeight: 700 }}>No participant entries found</p>
                    <span style={{ fontSize: '0.8rem' }}>
                      {search ? 'Try modifying your search criteria.' : 'Entries will appear here as users enter the lucky draw.'}
                    </span>
                  </td>
                </tr>
              ) : (
                participants.map((p, idx) => {
                  const itemIndex = (page - 1) * 15 + idx + 1;
                  return (
                    <tr 
                      key={p.entryId}
                      style={{
                        borderBottom: '1px solid #f8fafc',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px', fontWeight: 700, color: '#94a3b8' }}>
                        {itemIndex}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div 
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: '#f1f5f9',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 750,
                              fontSize: '0.8rem'
                            }}
                          >
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: 750, color: '#1e293b', display: 'block' }}>
                              {p.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px', fontWeight: 650, color: '#334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{p.mobileNumber}</span>
                          <button
                            onClick={() => copyToClipboard(p.mobileNumber, 'Mobile number copied!')}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '2px'
                            }}
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '14px', color: '#64748b' }}>
                        {formatDate(p.submittedAt)}
                      </td>
                      <td style={{ padding: '14px', color: '#94a3b8', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                        {p.entryId?.slice(-8)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9'
            }}
          >
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #e2e8f0',
                  background: '#ffffff',
                  color: page <= 1 ? '#cbd5e1' : '#475569',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #e2e8f0',
                  background: '#ffffff',
                  color: page >= totalPages ? '#cbd5e1' : '#475569',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. Create Lucky Draw Modal */}
      {createModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(6px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreateModalOpen(false);
          }}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setCreateModalOpen(false)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                border: 'none',
                background: '#f1f5f9',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#f2efff',
                  color: '#4A35E8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Plus size={20} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                Launch New Lucky Draw
              </h2>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 750, color: '#334155', marginBottom: '6px' }}>
                  Campaign Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 750, color: '#334155', marginBottom: '6px' }}>
                  Description / Prize Highlights
                </label>
                <textarea
                  rows={2}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 750, color: '#334155', marginBottom: '6px' }}>
                    Submission Deadline <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={createForm.submissionDeadline}
                    onChange={(e) => setCreateForm({ ...createForm, submissionDeadline: e.target.value })}
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 10px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 750, color: '#334155', marginBottom: '6px' }}>
                    Target Winner Count <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={createForm.numberOfWinners}
                    onChange={(e) => setCreateForm({ ...createForm, numberOfWinners: e.target.value })}
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <label 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 650,
                  color: '#475569',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                <input
                  type="checkbox"
                  checked={createForm.closePrevious}
                  onChange={(e) => setCreateForm({ ...createForm, closePrevious: e.target.checked })}
                />
                <span>Automatically archive any previous open lucky draws</span>
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  style={{
                    flex: 1,
                    height: '44px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#64748b',
                    fontWeight: 750,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    height: '44px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#4A35E8',
                    color: '#ffffff',
                    fontWeight: 750,
                    fontSize: '0.88rem',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Launching...' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Update Deadline Modal */}
      {deadlineModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(6px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeadlineModalOpen(false);
          }}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setDeadlineModalOpen(false)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                border: 'none',
                background: '#f1f5f9',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#f2efff',
                  color: '#4A35E8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Clock size={20} />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                Adjust Deadline
              </h2>
            </div>

            <form onSubmit={handleDeadlineSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 750, color: '#334155', marginBottom: '6px' }}>
                  New Submission Deadline Date & Time <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={deadlineForm.submissionDeadline}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, submissionDeadline: e.target.value })}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDeadlineModalOpen(false)}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#64748b',
                    fontWeight: 750,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#4A35E8',
                    color: '#ffffff',
                    fontWeight: 750,
                    fontSize: '0.88rem',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Updating...' : 'Save Deadline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Conduct Draw Confirmation Modal */}
      {drawModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(6px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDrawModalOpen(false);
          }}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setDrawModalOpen(false)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                border: 'none',
                background: '#f1f5f9',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div 
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}
              >
                <Trophy size={30} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 6px 0' }}>
                Conduct Lucky Draw Selection
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
                This will trigger cryptographically secure, unbiased winner selection among all {drawDetails?.totalParticipants || 0} participants.
              </p>
            </div>

            <form onSubmit={handleDrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 750, color: '#334155', marginBottom: '6px' }}>
                  Number of Winners to Pick <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, drawDetails?.totalParticipants || 1)}
                  required
                  value={drawForm.winnerCount}
                  onChange={(e) => setDrawForm({ winnerCount: e.target.value })}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.9rem',
                    outline: 'none',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Available participant pool: {drawDetails?.totalParticipants || 0} entries.
                </span>
              </div>

              <div 
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '0.8rem',
                  color: '#991b1b',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Once drawn, the lucky draw will be permanently finalized and winners published.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setDrawModalOpen(false)}
                  style={{
                    flex: 1,
                    height: '44px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#64748b',
                    fontWeight: 750,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    height: '44px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #7C3AED 0%, #4A35E8 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                  }}
                >
                  {submitting ? 'Drawing Winners...' : 'Confirm & Pick Winners'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
