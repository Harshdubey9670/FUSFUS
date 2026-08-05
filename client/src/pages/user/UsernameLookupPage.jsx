import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "../../services/api";

/**
 * Resolves /app/profile/u/:username → redirects to /app/profile/:id
 * Used by @mention links in captions.
 */
const UsernameLookupPage = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const resolve = async () => {
      try {
        const res = await api.get(`/api/users/username/${username}`);
        if (res.data.success) {
          navigate(`/app/profile/${res.data.data._id}`, { replace: true });
        } else {
          navigate("/app", { replace: true });
        }
      } catch {
        navigate("/app", { replace: true });
      }
    };
    resolve();
  }, [username, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-3" />
        <p className="text-text-secondary text-sm">Looking up @{username}...</p>
      </div>
    </div>
  );
};

export default UsernameLookupPage;
