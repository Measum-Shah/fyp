import { prisma } from '../../../../config/db';
import { getStudentByUser } from './studentPortal.helpers';
import bcrypt from 'bcryptjs';

export const getProfile = async (userId: number) => {
  const student = await getStudentByUser(userId);
  const profile = await prisma.students.findUnique({
    where: { id: student.id }
  });
  
  return profile;
};

export const updateProfile = async (userId: number, data: any) => {
  const student = await getStudentByUser(userId);
  
  // Restrict fields that can be updated
  const allowedUpdates = {
    home_phone: data.home_phone,
    mobile_1: data.mobile_1,
    mobile_2: data.mobile_2,
    address: data.address,
    temp_address: data.temp_address,
    city: data.city,
    state: data.state,
    country: data.country,
    student_image: data.student_image
  };
  
  // Filter out undefined
  const finalUpdates: any = {};
  for (const [k, v] of Object.entries(allowedUpdates)) {
    if (v !== undefined) finalUpdates[k] = v;
  }
  
  return await prisma.students.update({
    where: { id: student.id },
    data: finalUpdates
  });
};

export const changePassword = async (userId: number, data: any) => {
  const { current_password, new_password } = data;
  if (!current_password || !new_password) {
    throw new Error('Current and new password are required');
  }

  const user = await prisma.erpUsers.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  // Verify current password
  let isMatch = false;
  if (user.password) {
    try {
      isMatch = await bcrypt.compare(current_password, user.password);
    } catch {
      isMatch = current_password === user.password;
    }
  }

  if (!isMatch && user.string_password === current_password) {
    isMatch = true;
  }
  if (!isMatch) {
    throw new Error('Incorrect current password');
  }

  const hashedPassword = await bcrypt.hash(new_password, 12);
  
  await prisma.erpUsers.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      string_password: new_password,
      updated_at: new Date()
    }
  });

  return { message: 'Password updated successfully' };
};
