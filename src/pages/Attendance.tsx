import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCheck, Send } from 'lucide-react';

const WHATSAPP_NUMBER = '919359458298';

export default function Attendance() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const now = new Date();
  const [date] = useState(now.toISOString().split('T')[0]);
  const [time] = useState(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
  const [submitted, setSubmitted] = useState(false);
  const [approved, setApproved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast({ title: 'Missing info', description: 'Enter your name and phone number', variant: 'destructive' });
      return;
    }
    setSubmitted(true);
    toast({ title: 'Attendance Submitted!', description: 'Click "Approve & Send to WhatsApp" to confirm.' });
  };

  const handleApprove = () => {
    const text = encodeURIComponent(
      `📋 *Attendance Log*\n━━━━━━━━━━━━━━━━━━\n👤 Name: *${name}*\n📱 Phone: ${phone}\n📅 Date: ${date}\n🕐 Time: ${time}\n✅ Status: *Present*\n━━━━━━━━━━━━━━━━━━\n_Sadik Traders Attendance System_`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
    setApproved(true);
    toast({ title: 'Attendance Approved!', description: 'Sent to admin WhatsApp.' });
  };

  return (
    <div className="max-w-md mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex items-center gap-2 sm:gap-3">
        <ClipboardCheck className="text-primary" size={24} />
        <h1 className="page-header text-xl sm:text-2xl md:text-3xl">Attendance</h1>
      </div>

      <div className="glass-card p-4 sm:p-6 space-y-4 sm:space-y-6 animate-slide-up">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" className="input-focus" required />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter your phone number" className="input-focus" required type="tel" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input value={date} readOnly className="bg-muted/30" />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input value={time} readOnly className="bg-muted/30" />
              </div>
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground hover-glow">
              Submit Attendance
            </Button>
          </form>
        ) : !approved ? (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-sm text-left">
              <p><strong>Name:</strong> {name}</p>
              <p><strong>Phone:</strong> {phone}</p>
              <p><strong>Date:</strong> {date}</p>
              <p><strong>Time:</strong> {time}</p>
            </div>
            <Button onClick={handleApprove} className="w-full gap-2 gradient-primary text-primary-foreground hover-glow">
              <Send size={16} /> Approve & Send to WhatsApp
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-3 py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <ClipboardCheck size={32} className="text-success" />
            </div>
            <h3 className="font-display text-lg font-semibold text-success">Attendance Approved!</h3>
            <p className="text-sm text-muted-foreground">Your attendance has been sent to admin via WhatsApp.</p>
          </div>
        )}
      </div>
    </div>
  );
}
