import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [readings, setReadings] = useState([]);
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:4000/api/readings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setReadings(data))
      .catch(console.error);
  }, []);

  const addReading = async () => {
    const newReading = {
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      pulse: Number(pulse),
      notes,
      date: new Date().toISOString(),
      user: localStorage.getItem("username"),
    };

    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:4000/api/readings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newReading),
    });

    if (res.ok) {
      console.log(res);

      setReadings([newReading, ...readings]);
      setSystolic("");
      setDiastolic("");
      setPulse("");
      setNotes("");
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:4000/api/readings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setReadings(readings.filter(r => r.id !== id));
  };

  const [editing, setEditing] = useState(null);

  const startEditing = (reading) => {
    setEditing(reading);
    setSystolic(reading.systolic);
    setDiastolic(reading.diastolic);
    setPulse(reading.pulse);
    setNotes(reading.notes || "");
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:4000/api/readings/${editing.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ systolic, diastolic, pulse, notes }),
    });
    const updated = await res.json();
    setReadings(readings.map(r => r.id === updated.id ? updated : r));
    setEditing(null);
    setSystolic("");
    setDiastolic("");
    setPulse("");
    setNotes("");
  };


  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "auto" }}>
      <h1>Ciśnienie krwi</h1>

      <h3>Nowy pomiar</h3>
      <input placeholder="Skurczowe" value={systolic} onChange={(e) => setSystolic(e.target.value)} />
      <input placeholder="Rozkurczowe" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} />
      <input placeholder="Puls" value={pulse} onChange={(e) => setPulse(e.target.value)} />
      <textarea placeholder="Notatki" value={notes} onChange={(e) => setNotes(e.target.value)} />
      {editing ? (
        <button onClick={handleUpdate}>Zapisz zmiany</button>
      ) : (
        <button onClick={addReading}>Dodaj</button>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={readings.map((r) => ({
            date: new Date(r.date).toLocaleDateString(),
            systolic: r.systolic,
            diastolic: r.diastolic,
          }))}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorSystolic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDiastolic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="systolic"
            name="Skurczowe"
            stroke="#8884d8"
            fillOpacity={1}
            fill="url(#colorSystolic)"
          />
          <Area
            type="monotone"
            dataKey="diastolic"
            name="Rozkurczowe"
            stroke="#82ca9d"
            fillOpacity={1}
            fill="url(#colorDiastolic)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <h3>Historia</h3>
      <ul>
        {readings.map((r) => (
          <li key={r.id}>
            <div>{new Date(r.date).toLocaleString()} — {r.systolic}/{r.diastolic}, puls {r.pulse}</div>
            {r.notes && <div>📝 {r.notes}</div>}
            <button onClick={() => handleDelete(r.id)} className="text-red-500 mr-2">Usuń</button>
            <button onClick={() => startEditing(r)} className="text-blue-500">Edytuj</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
