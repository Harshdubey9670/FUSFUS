import { useSelector, useDispatch } from "react-redux";
import { updateSettings, optimisticUpdateSetting } from "../../store/authSlice";
import { useToast } from "../ui/Toast";
import { SettingToggle } from "./SettingToggle";
import { SettingSelect } from "./SettingSelect";

const TimeManagementSettings = () => {
  const { settings } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const handleUpdate = async (category, key, value) => {
    const updates = { [category]: { [key]: value } };
    dispatch(optimisticUpdateSetting(updates));
    
    try {
      await dispatch(updateSettings(updates)).unwrap();
    } catch (error) {
      toast({ variant: "error", title: "Error", description: "Failed to update setting" });
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold hero-text mb-2">Time Management</h2>
        <p className="text-text-secondary">Manage your time spent on SnapGram AI.</p>
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-2">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Daily Usage</h3>
        
        <SettingSelect
          label="Daily Time Limit"
          description="We'll remind you when you've reached your daily limit."
          value={settings?.timeManagement?.dailyLimitMinutes || 0}
          options={[
            { value: 0, label: 'No Limit' },
            { value: 15, label: '15 Minutes' },
            { value: 30, label: '30 Minutes' },
            { value: 60, label: '1 Hour' },
            { value: 120, label: '2 Hours' },
          ]}
          onChange={(val) => handleUpdate('timeManagement', 'dailyLimitMinutes', Number(val))}
        />

        <SettingSelect
          label="Take a Break Reminders"
          description="We'll remind you to take a break when you use the app consecutively."
          value={settings?.timeManagement?.breakReminderMinutes || 0}
          options={[
            { value: 0, label: 'Off' },
            { value: 10, label: 'Every 10 Minutes' },
            { value: 20, label: 'Every 20 Minutes' },
            { value: 30, label: 'Every 30 Minutes' },
          ]}
          onChange={(val) => handleUpdate('timeManagement', 'breakReminderMinutes', Number(val))}
        />
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-2">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Quiet Mode</h3>
        
        <SettingToggle 
          label="Enable Quiet Mode" 
          description="Mute push notifications during specific hours."
          checked={settings?.timeManagement?.quietMode || false}
          onChange={(val) => handleUpdate('timeManagement', 'quietMode', val)}
        />
        
        <div className={`transition-opacity duration-300 ${!settings?.timeManagement?.quietMode ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-secondary mb-1">Start Time</label>
              <input 
                type="time" 
                value={settings?.timeManagement?.quietModeStart || '22:00'}
                onChange={(e) => handleUpdate('timeManagement', 'quietModeStart', e.target.value)}
                className="w-full bg-bg-base border border-border-soft text-text-primary text-sm rounded-lg p-2.5"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-secondary mb-1">End Time</label>
              <input 
                type="time" 
                value={settings?.timeManagement?.quietModeEnd || '07:00'}
                onChange={(e) => handleUpdate('timeManagement', 'quietModeEnd', e.target.value)}
                className="w-full bg-bg-base border border-border-soft text-text-primary text-sm rounded-lg p-2.5"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeManagementSettings;
