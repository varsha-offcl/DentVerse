import * as React from "react";
import { Building2, MessageSquareText, Save, CheckCircle2 } from "lucide-react";
import { currentDoctor } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ClinicSettings() {
  const [clinicName, setClinicName] = React.useState(currentDoctor.clinic);
  const [address, setAddress] = React.useState("221B, MG Road, Bengaluru, Karnataka 560001");
  const [phone, setPhone] = React.useState("+91 80 4000 1234");
  const [aiBooking, setAiBooking] = React.useState(true);
  const [aiReminders, setAiReminders] = React.useState(true);
  const [autoEscalate, setAutoEscalate] = React.useState(true);
  const [saved, setSaved] = React.useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clinic Settings</h1>
        <p className="text-sm text-muted-foreground">Manage clinic profile and WhatsApp automation configuration.</p>
      </div>

      <Tabs defaultValue="clinic">
        <TabsList>
          <TabsTrigger value="clinic">Clinic Settings</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="clinic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Clinic Profile
              </CardTitle>
              <CardDescription>Basic information shown to patients and staff.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Clinic Name</Label>
                <Input value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Number</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-primary" /> WhatsApp Business API
              </CardTitle>
              <CardDescription>Connection status and AI receptionist automation controls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <div>
                    <p className="text-sm font-medium">Connected</p>
                    <p className="text-xs text-muted-foreground">Number: +91 80 4000 1234</p>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">AI Appointment Booking</p>
                  <p className="text-xs text-muted-foreground">Let AI book and confirm appointments automatically</p>
                </div>
                <Switch checked={aiBooking} onCheckedChange={setAiBooking} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Automated Reminders</p>
                  <p className="text-xs text-muted-foreground">Send reminders 24 hours and 1 hour before visits</p>
                </div>
                <Switch checked={aiReminders} onCheckedChange={setAiReminders} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Auto-Escalate Urgent Cases</p>
                  <p className="text-xs text-muted-foreground">Flag pain/urgent keywords for immediate staff review</p>
                </div>
                <Switch checked={autoEscalate} onCheckedChange={setAutoEscalate} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-3">
        <Button onClick={() => setSaved(true)}>
          <Save className="h-4 w-4" /> Save Changes
        </Button>
        {saved && <span className="text-sm text-success">Settings updated ✓</span>}
      </div>
    </div>
  );
}
