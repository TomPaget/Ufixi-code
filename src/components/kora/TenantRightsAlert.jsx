import { AlertCircle, Home, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function TenantRightsAlert({ userType }) {
  if (!userType) return null;

  const isRenter = userType === "renter";

  if (isRenter) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border-2 border-blue-400 rounded-2xl p-5"
      >
        <div className="flex items-start gap-3 mb-3">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-blue-900 text-lg">Your Rights as a Tenant</h3>
            <p className="text-sm text-blue-800 mt-1">
              Your landlord is responsible for maintaining the property in a safe and habitable condition. Before hiring a tradesperson, contact your landlord first.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 mt-4 border border-blue-200">
          <p className="text-sm text-blue-900 font-semibold mb-3">Key Rights:</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-blue-800">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Your landlord must fix problems affecting safety and habitability</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-blue-800">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Keep written records of all repair requests and communications</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-blue-800">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Do not pay for repairs yourself without written agreement from your landlord</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-blue-800">
              <span className="text-blue-600 font-bold">✓</span>
              <span>You have the right to make repairs if landlord doesn't act within a reasonable timeframe</span>
            </li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-900 font-semibold mb-1">⚠️ Before You Proceed:</p>
          <p className="text-sm text-amber-800">
            Contact your landlord in writing (email is best) and give them reasonable time to respond. Only hire a professional or do DIY repairs if your landlord fails to respond or refuses.
          </p>
        </div>
      </motion.div>
    );
  }

  // Homeowner view
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-green-50 border-2 border-green-400 rounded-2xl p-5"
    >
      <div className="flex items-start gap-3">
        <Home className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-green-900 text-lg">You Own Your Home</h3>
          <p className="text-sm text-green-800 mt-1">
            As a homeowner, you're responsible for all repairs and maintenance. You have full control over how to proceed with fixing this issue.
          </p>
        </div>
      </div>
    </motion.div>
  );
}