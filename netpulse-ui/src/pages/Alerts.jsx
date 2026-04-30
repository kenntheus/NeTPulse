import { useEffect, useState } from "react";
import axios from "axios";

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get("/api/alerts"); // adjust endpoint if needed
      setAlerts(response.data);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Alerts</h1>

      {loading ? (
        <p className="text-gray-500">Loading alerts...</p>
      ) : alerts.length === 0 ? (
        <p className="text-gray-500">No alerts found.</p>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl shadow border-l-4 ${
                alert.severity === "high"
                  ? "border-red-500 bg-red-50"
                  : alert.severity === "medium"
                  ? "border-yellow-500 bg-yellow-50"
                  : "border-green-500 bg-green-50"
              }`}
            >
              <h2 className="font-semibold text-lg">
                {alert.title || "Alert"}
              </h2>
              <p className="text-sm text-gray-600">
                {alert.message || "No message provided"}
              </p>
              <span className="text-xs text-gray-400">
                {new Date(alert.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;