import { prisma } from "../../../config/db";

// ── Fixed Assets ───────────────────────────────────────────────────────────
export const getFixedAssets = async () => {
  return await prisma.accFixedAsset.findMany({
    orderBy: { created_at: "desc" },
  });
};

export const createFixedAsset = async (data: {
  name: string;
  category: string;
  purchase_date: string;
  purchase_cost: number;
  useful_life_years: number;
  depreciation_method?: string;
}) => {
  const count = await prisma.accFixedAsset.count();
  const assetCode = `AST-${String(count + 1).padStart(4, "0")}`;

  return await prisma.accFixedAsset.create({
    data: {
      asset_code: assetCode,
      name: data.name,
      category: data.category,
      purchase_date: new Date(data.purchase_date),
      purchase_cost: data.purchase_cost,
      useful_life_years: data.useful_life_years,
      depreciation_method: data.depreciation_method || "STRAIGHT_LINE",
      accumulated_depreciation: 0,
      net_book_value: data.purchase_cost,
      status: "ACTIVE",
    },
  });
};

export const runDepreciation = async (assetId: number) => {
  const asset = await prisma.accFixedAsset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error("Asset not found");

  const annualDep = Number(asset.purchase_cost) / (asset.useful_life_years || 1);
  const newAccDep = Number(asset.accumulated_depreciation) + annualDep;
  const newNBV = Math.max(0, Number(asset.purchase_cost) - newAccDep);

  return await prisma.accFixedAsset.update({
    where: { id: assetId },
    data: {
      accumulated_depreciation: newAccDep,
      net_book_value: newNBV,
    },
  });
};
