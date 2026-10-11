import React, { useEffect, useState } from "react";
import {
  fetchFixedAssetsApi,
  createFixedAssetApi,
  runDepreciationApi,
  type FixedAssetItem,
} from "../services/accounts.service";
import { S, statusColor, pkr } from "../utils/styles";

export const FixedAssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<FixedAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [depreciatingId, setDepreciatingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formData, setFormData] = useState({
    asset_code: "",
    name: "",
    category: "MACHINERY",
    purchase_date: new Date().toISOString().split("T")[0],
    purchase_cost: 0,
    useful_life_years: 5,
    depreciation_method: "STRAIGHT_LINE",
    description: "",
  });

  const loadAssets = async () => {
    try {
      setLoading(true);
      const res = await fetchFixedAssetsApi();
      if (res.success) setAssets(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFixedAssetApi(formData);
      setShowModal(false);
      loadAssets();
      setFormData({
        asset_code: "",
        name: "",
        category: "MACHINERY",
        purchase_date: new Date().toISOString().split("T")[0],
        purchase_cost: 0,
        useful_life_years: 5,
        depreciation_method: "STRAIGHT_LINE",
        description: "",
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRunDepreciation = async (id: number) => {
    try {
      setDepreciatingId(id);
      await runDepreciationApi(id);
      await loadAssets();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDepreciatingId(null);
    }
  };

  const filteredAssets = assets.filter((ast) => {
    const mSearch =
      !search ||
      ast.name.toLowerCase().includes(search.toLowerCase()) ||
      ast.asset_code?.toLowerCase().includes(search.toLowerCase());
    const mCat = !categoryFilter || ast.category === categoryFilter;
    const mStat = !statusFilter || ast.status === statusFilter;
    return mSearch && mCat && mStat;
  });

  const totalAssets = assets.length;
  const totalCost = assets.reduce((acc, ast) => acc + Number(ast.purchase_cost || 0), 0);
  const totalNbv = assets.reduce((acc, ast) => acc + Number(ast.net_book_value || 0), 0);
  const fullyDepreciatedCount = assets.filter((ast) => ast.status === "FULLY_DEPRECIATED").length;

  const getAssetStatusColor = (status: string) => {
    if (status === "ACTIVE") return "green";
    if (status === "DISPOSED") return "red";
    if (status === "FULLY_DEPRECIATED") return "gray";
    return statusColor(status);
  };

  return (
    <div style={S.page}>
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Fixed Assets & Depreciation</h1>
          <p style={S.subtitle}>Track asset acquisition costs, accumulated depreciation & net book values.</p>
        </div>
        <button style={S.btnPrimary} onClick={() => setShowModal(true)}>
          + Add Asset Record
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <div style={{ background: "var(--card-bg)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--card-border)" }}>
          <div style={S.subtitle}>Total Assets</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-dark)", marginTop: "0.25rem" }}>
            {totalAssets}
          </div>
        </div>
        <div style={{ background: "var(--card-bg)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--card-border)" }}>
          <div style={S.subtitle}>Total Cost</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-dark)", marginTop: "0.25rem" }}>
            {pkr(totalCost)}
          </div>
        </div>
        <div style={{ background: "var(--card-bg)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--card-border)" }}>
          <div style={S.subtitle}>Net Book Value</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-dark)", marginTop: "0.25rem" }}>
            {pkr(totalNbv)}
          </div>
        </div>
        <div style={{ background: "var(--card-bg)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--card-border)" }}>
          <div style={S.subtitle}>Fully Depreciated</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-dark)", marginTop: "0.25rem" }}>
            {fullyDepreciatedCount}
          </div>
        </div>
      </div>

      <div style={S.filterBar}>
        <input
          style={S.input}
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={S.select} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          <option value="BUILDING">BUILDING</option>
          <option value="VEHICLE">VEHICLE</option>
          <option value="MACHINERY">MACHINERY</option>
          <option value="COMPUTER">COMPUTER</option>
          <option value="FURNITURE">FURNITURE</option>
          <option value="EQUIPMENT">EQUIPMENT</option>
          <option value="OTHER">OTHER</option>
        </select>
        <select style={S.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="DISPOSED">DISPOSED</option>
          <option value="FULLY_DEPRECIATED">FULLY DEPRECIATED</option>
        </select>
      </div>

      <div style={S.tableWrap}>
        {loading ? (
          <div style={S.emptyRow}>Loading fixed assets...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Asset Code</th>
                  <th style={S.th}>Name</th>
                  <th style={S.th}>Category</th>
                  <th style={S.th}>Purchase Date</th>
                  <th style={S.thRight}>Cost</th>
                  <th style={S.thRight}>Useful Life</th>
                  <th style={S.thRight}>Accum. Dep.</th>
                  <th style={S.thRight}>Net Book Value</th>
                  <th style={{ ...S.th, textAlign: "center" }}>Status</th>
                  <th style={{ ...S.th, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={S.emptyRow}>
                      No assets found.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((ast) => (
                    <tr key={ast.id}>
                      <td style={S.td}>
                        <span style={S.mono}>{ast.asset_code}</span>
                      </td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{ast.name}</td>
                      <td style={S.td}>{ast.category}</td>
                      <td style={S.td}>{ast.purchase_date}</td>
                      <td style={S.tdRight}>{pkr(ast.purchase_cost)}</td>
                      <td style={S.tdRight}>{ast.useful_life_years} Yrs</td>
                      <td style={{ ...S.tdRight, color: "var(--error)" }}>{pkr(ast.accumulated_depreciation)}</td>
                      <td style={{ ...S.tdRight, color: "#10b981" }}>{pkr(ast.net_book_value)}</td>
                      <td style={S.tdCenter}>
                        <span style={S.tag(getAssetStatusColor(ast.status))}>{ast.status || "ACTIVE"}</span>
                      </td>
                      <td style={S.tdCenter}>
                        <button
                          style={{ ...S.btnSecondary, padding: "0.4rem 0.75rem", fontSize: "0.75rem" }}
                          onClick={() => handleRunDepreciation(ast.id)}
                          disabled={depreciatingId === ast.id || ast.status === "FULLY_DEPRECIATED" || ast.status === "DISPOSED"}
                        >
                          {depreciatingId === ast.id ? "Running..." : "Run Dep."}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h2 style={S.modalTitle}>Register Fixed Asset</h2>
            <form onSubmit={handleCreate}>
              <div style={S.formGrid}>
                <div style={S.formGroup}>
                  <label style={S.label}>Asset Code</label>
                  <input
                    style={S.input}
                    required
                    value={formData.asset_code}
                    onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
                  />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Asset Name *</label>
                  <input
                    style={S.input}
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Category</label>
                  <select
                    style={S.select}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="BUILDING">BUILDING</option>
                    <option value="VEHICLE">VEHICLE</option>
                    <option value="MACHINERY">MACHINERY</option>
                    <option value="COMPUTER">COMPUTER</option>
                    <option value="FURNITURE">FURNITURE</option>
                    <option value="EQUIPMENT">EQUIPMENT</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Purchase Date</label>
                  <input
                    style={S.input}
                    type="date"
                    required
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Purchase Cost (PKR) *</label>
                  <input
                    style={S.input}
                    type="number"
                    step="0.01"
                    required
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({ ...formData, purchase_cost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Useful Life (Years)</label>
                  <input
                    style={S.input}
                    type="number"
                    required
                    value={formData.useful_life_years}
                    onChange={(e) => setFormData({ ...formData, useful_life_years: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Depreciation Method</label>
                  <select
                    style={S.select}
                    value={formData.depreciation_method}
                    onChange={(e) => setFormData({ ...formData, depreciation_method: e.target.value })}
                  >
                    <option value="STRAIGHT_LINE">Straight Line</option>
                    <option value="REDUCING_BALANCE">Reducing Balance</option>
                  </select>
                </div>
              </div>
              
              <div style={{ ...S.formGroup, marginTop: "1rem" }}>
                <label style={S.label}>Description</label>
                <textarea
                  style={S.textarea}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={S.modalFooter}>
                <button type="button" style={S.btnSecondary} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={S.btnPrimary}>
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
