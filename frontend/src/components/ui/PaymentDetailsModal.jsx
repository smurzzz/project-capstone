import { AlertCircle, CreditCard, DollarSign, X } from "lucide-react";
import { Button } from "./button.jsx";
import gcashLogo from "../../assets/gcash.png";
import bpiLogo from "../../assets/bpi.png";

const paymentDetails = {
  gcash: {
    title: "GCash",
    label: "GCash Payment Details",
    fields: [
      { label: "GCash Number", value: "0917 147 3482" },
      { label: "Account Name", value: "JERSON MONTANO" },
    ],
    description:
      "Please send your payment to the GCash account above. After completing your payment, enter the reference number below.",
    logoSrc: gcashLogo,
    icon: <CreditCard className="h-5 w-5 text-blue-700" />,
  },
  bank_transfer: {
    title: "Bank Transfer",
    label: "Bank Transfer Details",
    fields: [
      { label: "Bank Name", value: "BPI" },
      { label: "Account Number", value: "1234 5678 9012" },
      { label: "Account Name", value: "JBM ELECTRO VENTURES" },
    ],
    description:
      "Please send your bank transfer to the account above. After completing your payment, enter the reference number below.",
    logoSrc: bpiLogo,
    icon: <DollarSign className="h-5 w-5 text-blue-700" />,
  },
};

export default function PaymentDetailsModal({
  open,
  onClose,
  paymentMethod,
  referenceNumber,
  onReferenceNumberChange,
  onConfirm,
  referenceRequired = true,
}) {
  if (!open || !paymentMethod) return null;

  const details = paymentDetails[paymentMethod];
  if (!details) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Payment Information
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">
              Complete your payment using the details below.
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close payment modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex flex-col gap-3 text-slate-900 sm:flex-row sm:items-center">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                {details.logoSrc ? (
                  <img src={details.logoSrc} alt={`${details.title} logo`} className="h-8 w-auto" />
                ) : (
                  details.icon
                )}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-500">Payment Method</p>
                <p className="mt-1 text-base font-semibold">{details.title}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            {details.fields.map((field) => (
              <div key={field.label} className="flex flex-col gap-2 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-slate-600">{field.label}</span>
                <span className="min-w-0 rounded-full bg-white px-3 py-2 text-slate-900 shadow-sm break-words sm:text-right">
                  {field.value}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-blue-50 px-4 py-4 text-sm text-slate-700">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-blue-700" />
              <div>{details.description}</div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="paymentReference" className="text-sm font-medium text-slate-700">
              Reference Number {referenceRequired ? '*' : '(optional)'}
            </label>
            <input
              id="paymentReference"
              type="text"
              value={referenceNumber}
              onChange={(event) => onReferenceNumberChange(event.target.value)}
              placeholder={referenceRequired ? "Enter reference number" : "Optional reference number"}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="button"
            disabled={referenceRequired && !referenceNumber?.trim()}
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
