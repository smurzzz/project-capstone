import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { membershipAPI } from "../../utils/api";

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString();
};

export default function MembershipStatus() {
  const navigate = useNavigate();
  const [membershipData, setMembershipData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembership = async () => {
      try {
        const response = await membershipAPI.getMyMembership();
        setMembershipData(response.data.data || null);
      } catch (error) {
        console.error("Error loading membership status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembership();
  }, []);

  const membership = membershipData?.membership || null;
  const status = membership?.status || "None";
  const date = status === "None" ? null : membership?.joinedAt || membership?.approvedAt || membership?.expiresAt || membershipData?.applicationSubmittedAt;
  const packageName = membershipData?.selectedPackageDeal?.name || membershipData?.entryPackage || "N/A";
  const paymentMethod = membershipData?.membershipPaymentInfo?.paymentMethod || "N/A";
  const paymentReference = membershipData?.membershipPaymentInfo?.referenceNumber || "N/A";
  const submittedAt = membershipData?.applicationSubmittedAt;
  const applicationNotes = membershipData?.applicationNotes || "No notes available.";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-xl">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Membership Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <p className="text-sm text-gray-600">Loading status...</p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{status}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{formatDate(date)}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Package</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{packageName}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Method</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{paymentMethod}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Reference</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{paymentReference}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applied At</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{formatDate(submittedAt)}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Application Notes</p>
                  <p className="mt-2 text-sm text-slate-700">{applicationNotes}</p>
                </div>
              </div>
            )}

            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
