import  { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '@/lib/axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { json } from 'stream/consumers';


const CreateGroupForm = () => {
  const [groupName, setGroupName] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdGroupName, setCreatedGroupName] = useState('');
  const navigate = useNavigate();

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    if (!user?._id) return;

    API.get(`/api/chat/full-chat-list/${user._id}`)
      .then(res => {
        setContacts(res.data.data || []);
      })
      .catch(err => {
        console.error("❌ API Error:", err.response?.data || err.message || err);
      });
  }, [user?._id]);

  console.log(contacts)

  const handleCreateGroup = async () => {
    if (!groupName || selectedMembers.length < 2) {
      alert('Please enter group name and select at least 2 members');
      return;
    }

    try {
      const res = await API.post('/api/group/groups', {
        name: groupName,
        members: selectedMembers,
        admins:[user?._id]
      });
// console.log(res.data)
localStorage.setItem("groupID", res.data._id);
      setCreatedGroupName(res.data.name);
      setShowSuccessDialog(true);
    } catch (err) {
      console.error(err);
      alert('Error creating group');
    }
  };

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
    navigate('/chatlist');
  };

  return (
    <>
      <div className="p-4 h-full rounded shadow space-y-4 my-16">
        <h2 className="text-xl font-bold">Create Group</h2>

        <Label>Group Name</Label>
        <Input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <Label>Select Members</Label>
        <select
  multiple
  className="w-full border px-3 py-2 rounded h-40"
  value={selectedMembers}
  onChange={(e) => {
    const selectedIds = Array.from(e.target.selectedOptions).map((opt) => opt.value);
    setSelectedMembers(selectedIds);
    console.log(selectedIds)
  }}
>

          {contacts
            .filter((c) => c.type !== 'group') // only show individual users
            .map((c) => (
              <option key={c._id} value={c._id}>
                {c.userName || c.display_name}
              </option>
            ))}
        </select>

        <Button className="w-full" onClick={handleCreateGroup}>
          Create Group
        </Button>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 Group Created</DialogTitle>
            <DialogDescription>
              Group <strong>{createdGroupName}</strong> created successfully.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleCloseDialog}>Go to Chat List</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateGroupForm;
