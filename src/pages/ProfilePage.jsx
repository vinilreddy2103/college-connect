import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, uploadProfileImage } from '../firebase'; // We will create these functions
import { toast } from 'react-toastify';
import { FaUserCircle, FaEdit, FaSave } from 'react-icons/fa';

function ProfilePage() {
    const { currentUser, userData, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Populate the form with user data once it's loaded
    useEffect(() => {
        if (userData) {
            setDisplayName(userData.displayName || '');
            setImagePreview(userData.photoURL || '');
        }
    }, [userData]);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            // Create a temporary URL for the preview
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleImageUpload = async () => {
        if (!imageFile) return;
        setUploading(true);
        try {
            const photoURL = await uploadProfileImage(imageFile, currentUser.uid);
            await updateUserProfile(currentUser.uid, { photoURL });
            toast.success("Profile picture updated successfully!");
            setImageFile(null); // Clear the file after upload
        } catch (error) {
            toast.error("Failed to upload image. Please try again.");
            console.error(error);
        }
        setUploading(false);
    };

    const handleNameSave = async () => {
        if (displayName === userData.displayName) {
            setEditMode(false);
            return;
        }
        setSaving(true);
        try {
            await updateUserProfile(currentUser.uid, { displayName });
            toast.success("Display name updated successfully!");
            setEditMode(false);
        } catch (error) {
            toast.error("Failed to update name. Please try again.");
            console.error(error);
        }
        setSaving(false);
    };

    if (authLoading) {
        return <div className="min-h-screen bg-slate-900 text-white text-center p-8">Loading profile...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-sky-400 mb-6">My Profile</h1>

                {/* Profile Picture Section */}
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8 flex flex-col items-center">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-sky-500" />
                    ) : (
                        <FaUserCircle className="w-32 h-32 text-slate-600" />
                    )}
                    <input
                        type="file"
                        id="profile-picture-upload"
                        className="hidden"
                        accept="image/png, image/jpeg"
                        onChange={handleImageChange}
                    />
                    <label htmlFor="profile-picture-upload" className="mt-4 cursor-pointer px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-600">
                        Choose Image
                    </label>
                    {imageFile && (
                        <button onClick={handleImageUpload} disabled={uploading} className="mt-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-800">
                            {uploading ? 'Uploading...' : 'Upload & Save'}
                        </button>
                    )}
                </div>

                {/* Profile Details Section */}
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                    <div className="space-y-4">
                        {/* Display Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400">Display Name</label>
                            <div className="mt-1 flex items-center">
                                {editMode ? (
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="flex-grow px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                                    />
                                ) : (
                                    <p className="text-lg text-white">{userData?.displayName}</p>
                                )}
                                {editMode ? (
                                    <button onClick={handleNameSave} disabled={saving} className="ml-4 p-2 text-white bg-sky-600 rounded-full hover:bg-sky-700">
                                        <FaSave />
                                    </button>
                                ) : (
                                    <button onClick={() => setEditMode(true)} className="ml-4 p-2 text-gray-400 hover:text-white">
                                        <FaEdit />
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400">Email Address</label>
                            <p className="text-lg text-gray-300">{userData?.email}</p>
                        </div>
                        {/* College */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400">College</label>
                            <p className="text-lg text-gray-300">{userData?.collegeName}</p>
                        </div>
                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400">Role</label>
                            <p className="text-lg text-yellow-400 uppercase font-semibold">{userData?.role}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;