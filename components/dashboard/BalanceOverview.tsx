import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useGlobalFinance } from "@/contexts/GlobalFinanceContext";
import { TrashIcon, CheckIcon } from "@radix-ui/react-icons";

type BalanceSource = {
  id?: string;
  name: string;
  balance: number;
  isBitcoin?: boolean;
};

const SATOSHI_TO_USD = 0.00025;
const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"];

export function BalanceOverview() {
  const [sources, setSources] = useState<BalanceSource[]>([]);
  const [newSource, setNewSource] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { globalTotal, updateGlobalTotal, user } = useGlobalFinance();

  useEffect(() => {
    if (user) {
      fetchSources();
    }
  }, [user]);

  const fetchSources = async () => {
    if (!user) return;
    setLoading(true);
    const sourcesCollection = collection(
      db,
      "users",
      user.uid,
      "balanceSources"
    );
    const sourcesSnapshot = await getDocs(sourcesCollection);
    const sourcesList = sourcesSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as BalanceSource)
    );
    setSources(sourcesList);
    setLoading(false);
    updateGlobalTotalFromSources(sourcesList);
  };

  const updateGlobalTotalFromSources = (sourcesList: BalanceSource[]) => {
    const newTotal = sourcesList.reduce((total, source) => {
      return source.name.toLowerCase() === "sats" ||
        source.name.toLowerCase() === "satoshi"
        ? total + source.balance * SATOSHI_TO_USD
        : total + source.balance;
    }, 0);
    updateGlobalTotal(newTotal);
  };

  const handleInputChange = (index: number, value: number) => {
    const updatedSources = sources.map((source, i) =>
      i === index ? { ...source, balance: value } : source
    );
    setSources(updatedSources);
    setEditingIndex(index);
  };

  const saveChanges = async (index: number) => {
    if (!user) return;
    const sourceToUpdate = sources[index];
    if (sourceToUpdate.id) {
      await updateDoc(
        doc(db, "users", user.uid, "balanceSources", sourceToUpdate.id),
        {
          balance: sourceToUpdate.balance,
        }
      );
    }
    setEditingIndex(null);
    updateGlobalTotalFromSources(sources);
  };

  const addNewSource = async () => {
    if (!newSource || !user) return;
    const newSourceData = { name: newSource, balance: 0 };
    const docRef = await addDoc(
      collection(db, "users", user.uid, "balanceSources"),
      newSourceData
    );
    const updatedSources = [...sources, { ...newSourceData, id: docRef.id }];
    setSources(updatedSources);
    setNewSource("");
    updateGlobalTotalFromSources(updatedSources);
  };

  const deleteSource = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "balanceSources", id));
    const updatedSources = sources.filter((source) => source.id !== id);
    setSources(updatedSources);
    updateGlobalTotalFromSources(updatedSources);
  };

  const chartData = sources.map((source) => ({
    name: source.name,
    value:
      source.name.toLowerCase() === "sats" ||
      source.name.toLowerCase() === "satoshi"
        ? source.balance * SATOSHI_TO_USD
        : source.balance,
  }));

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>Balance Overview: ${globalTotal.toFixed(2)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
          <div className="w-full md:w-1/2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 md:mt-0 w-full md:w-1/2 max-h-64 overflow-y-auto space-y-4">
            <h3 className="text-lg font-semibold mb-2 text-center md:text-left">
              Sources
            </h3>
            {sources.map((source, index) => (
              <div key={source.id} className="flex items-center space-x-2">
                <Label htmlFor={`balance-${index}`} className="w-24">
                  {source.name}
                </Label>
                <Input
                  id={`balance-${index}`}
                  type="number"
                  value={source.balance}
                  onChange={(e) =>
                    handleInputChange(index, parseFloat(e.target.value) || 0)
                  }
                  className="w-40"
                />
                {(source.name.toLowerCase() === "sats" ||
                  source.name.toLowerCase() === "satoshi") && (
                  <span className="text-sm text-gray-500">
                    ≈ ${(source.balance * SATOSHI_TO_USD).toFixed(2)} USD
                  </span>
                )}
                {editingIndex === index && (
                  <Button variant="ghost" onClick={() => saveChanges(index)}>
                    <CheckIcon className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => source.id && deleteSource(source.id)}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2 justify-center mt-4">
          <Input
            placeholder="New Source Name"
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
            className="w-40"
          />
          <Button onClick={addNewSource}>Add Source</Button>
        </div>
      </CardContent>
    </Card>
  );
}
