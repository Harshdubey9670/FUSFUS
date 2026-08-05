import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import api from '../../services/api';
import { loginSuccess } from '../../store/authSlice';
import { Image as ImageIcon, Camera, Loader2, CheckCircle, ShieldAlert } from 'lucide-react';
import { cn } from '../../utils/cn';

export const EditProfileModal = ({ isOpen, onClose, user, onProfileUpdated }) => {
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    website: '',
    avatar: '',
    coverPhoto: '',
    pronouns: '',
    gender: '',
    category: '',
    accountType: 'personal',
    isPrivate: false,
    verificationRequestStatus: 'none'
  });
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const { showToast } = useToast();
  const dispatch = useDispatch();

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        username: user.username || '',
        bio: user.bio || '',
        website: user.website || '',
        avatar: user.avatar || user.profilePicture || '',
        coverPhoto: user.coverPhoto || '',
        pronouns: user.pronouns || '',
        gender: user.gender || '',
        category: user.category || '',
        accountType: user.accountType || 'personal',
        isPrivate: user.isPrivate || false,
        verificationRequestStatus: user.verificationRequestStatus || 'none'
      });
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      return showToast('Image must be less than 5MB', 'error');
    }

    const uploadData = new FormData();
    uploadData.append('image', file);
    
    const setLoader = type === 'avatar' ? setUploadingAvatar : setUploadingCover;
    setLoader(true);
    
    try {
      showToast(`Uploading ${type}...`, 'info');
      const response = await api.post('/api/upload', uploadData);
      
      if (response.data.success) {
        setFormData(prev => ({ ...prev, [type]: response.data.data.url }));
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded!`, 'success');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setLoader(false);
    }
  };

  const requestVerification = async () => {
    try {
      const res = await api.post('/api/users/verification-request');
      if (res.data.success) {
        setFormData(prev => ({ ...prev, verificationRequestStatus: 'pending' }));
        showToast("Verification requested successfully", "success");
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Verification request failed', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/api/users/update', formData);
      if (response.data.success) {
        showToast('Profile updated successfully!', 'success');
        dispatch(loginSuccess(response.data.data));
        if (onProfileUpdated) {
          onProfileUpdated(response.data.data);
        }
        onClose();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSubmit} className="flex flex-col h-[70vh] md:h-[80vh] overflow-hidden -mx-4 md:-mx-6 mt-4">
        
        <div className="flex-1 overflow-y-auto px-4 md:px-6 hide-scrollbar space-y-8 pb-10">
          
          {/* Cover Photo */}
          <div className="relative w-full h-32 md:h-48 bg-bg-surface-hover rounded-2xl overflow-hidden group border border-border-soft">
            {formData.coverPhoto ? (
              <img src={formData.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm font-medium">Add Cover Photo</span>
              </div>
            )}
            <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {uploadingCover ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white mb-1" />}
              <span className="text-white text-xs font-medium">{uploadingCover ? 'Uploading...' : 'Change Cover'}</span>
              <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={(e) => handleImageUpload(e, 'coverPhoto')} disabled={uploadingCover} />
            </label>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center -mt-16 md:-mt-20 relative z-10">
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full group cursor-pointer border-4 border-bg-base bg-bg-surface-hover shadow-lg">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center text-text-secondary text-sm font-medium">
                  Avatar
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploadingAvatar ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} disabled={uploadingAvatar} />
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-2">Basic Info</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Username</label>
                <Input name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Pronouns</label>
                <Input name="pronouns" placeholder="e.g. she/her, they/them" value={formData.pronouns} onChange={handleChange} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Bio</label>
              <textarea
                name="bio"
                rows="3"
                placeholder="Tell us about yourself..."
                className="design-input w-full rounded-xl px-3 py-2 text-sm placeholder:text-text-secondary focus:outline-none resize-none"
                value={formData.bio}
                onChange={handleChange}
                maxLength={150}
              />
              <div className="text-right text-xs text-text-secondary mt-1">{formData.bio.length} / 150</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Website</label>
              <Input name="website" placeholder="https://yourwebsite.com" value={formData.website} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Gender</label>
              <select 
                name="gender" 
                value={formData.gender} 
                onChange={handleChange}
                className="design-input w-full rounded-xl px-3 py-2.5 text-sm bg-transparent appearance-none"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Custom">Custom</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Professional Settings */}
          <div className="space-y-4 pt-4 border-t border-border-soft">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-2">Account Type</h3>
            
            <div className="grid grid-cols-3 gap-2">
              {['personal', 'creator', 'business'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, accountType: type }))}
                  className={cn(
                    "py-2 px-3 rounded-lg border text-sm font-medium capitalize transition-colors",
                    formData.accountType === type 
                      ? "border-primary-500 bg-primary-500/10 text-primary-500" 
                      : "border-border-soft bg-transparent text-text-secondary hover:bg-bg-surface-hover"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>

            {(formData.accountType === 'creator' || formData.accountType === 'business') && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
                <Input name="category" placeholder="e.g. Artist, Musician, Entrepreneur" value={formData.category} onChange={handleChange} />
              </motion.div>
            )}
          </div>

          {/* Privacy & Security */}
          <div className="space-y-4 pt-4 border-t border-border-soft">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-2">Privacy & Verification</h3>
            
            <div className="flex items-center justify-between p-4 bg-bg-surface rounded-xl border border-border-soft">
              <div>
                <p className="text-text-primary text-sm font-medium">Private Account</p>
                <p className="text-text-secondary text-xs mt-1 max-w-[250px]">When your account is private, only people you approve can see your photos and videos.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors relative shrink-0",
                  formData.isPrivate ? "bg-primary-500" : "bg-bg-surface-hover border border-border-soft"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full bg-white absolute top-1 transition-all",
                  formData.isPrivate ? "left-6" : "left-1"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-bg-surface rounded-xl border border-border-soft">
              <div>
                <p className="text-text-primary text-sm font-medium flex items-center gap-1.5">
                  Verification Badge
                  {user?.isVerified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                </p>
                <p className="text-text-secondary text-xs mt-1 max-w-[250px]">
                  {user?.isVerified 
                    ? "Your account is verified." 
                    : formData.verificationRequestStatus === 'pending'
                      ? "Your verification request is pending review."
                      : "Request a blue checkmark to verify your authenticity."}
                </p>
              </div>
              {!user?.isVerified && formData.verificationRequestStatus !== 'pending' && (
                <Button type="button" variant="secondary" size="sm" onClick={requestVerification}>
                  Request
                </Button>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 md:px-6 border-t border-border-soft flex gap-3 bg-bg-base shrink-0">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="ai" className="flex-1" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
