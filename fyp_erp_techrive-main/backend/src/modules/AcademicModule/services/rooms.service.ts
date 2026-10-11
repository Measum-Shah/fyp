import { prisma } from "../../../config/db";

export interface RoomInput {
  name: string;
  department_id?: number | null;
  building_id?: number | null;
  room_type_id?: number | null;
  description?: number | null; // Note: Schema defines this as Int?
  status?: string;
}

export class RoomsService {
  static async list() {
    const [rooms, departments] = await Promise.all([
      prisma.rooms.findMany({
        where: { deleted_at: null },
        orderBy: { name: "asc" },
      }),
      prisma.departments.findMany({
        where: { deleted_at: null },
        select: { id: true, name: true },
      }),
    ]);

    const deptMap = new Map(departments.map((d) => [d.id, d.name]));

    return rooms.map((room) => ({
      ...room,
      department_name: room.department_id ? deptMap.get(room.department_id) || null : null,
    }));
  }

  static async lookups() {
    const departments = await prisma.departments.findMany({
      where: { deleted_at: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return { departments };
  }

  static async create(data: RoomInput & { created_by?: number | null }) {
    return prisma.rooms.create({
      data: {
        name: data.name,
        department_id: data.department_id,
        building_id: data.building_id,
        room_type_id: data.room_type_id,
        description: data.description,
        status: data.status || "Active",
        created_by: data.created_by,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  static async update(id: number, data: Partial<RoomInput> & { updated_by?: number | null }) {
    const existing = await prisma.rooms.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("Room not found.");

    return prisma.rooms.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.department_id !== undefined && { department_id: data.department_id }),
        ...(data.building_id !== undefined && { building_id: data.building_id }),
        ...(data.room_type_id !== undefined && { room_type_id: data.room_type_id }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        updated_by: data.updated_by,
        updated_at: new Date(),
      },
    });
  }

  static async remove(id: number, deleted_by?: number) {
    const existing = await prisma.rooms.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("Room not found.");

    return prisma.rooms.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by,
        status: "Inactive",
      },
    });
  }
}
