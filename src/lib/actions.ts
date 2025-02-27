"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,
  ExamSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { parse } from "path";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

type CurrentState = { success: boolean; error: boolean };

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.create({
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    const client = await clerkClient();
    const user = await client.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.teacher.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        address: data.address,
        img: data.img,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const client = await clerkClient();
    const user = await client.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        address: data.address,
        img: data.img,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const client = await clerkClient();
    const user = await client.users.deleteUser(id);
    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  const classItem = await prisma.class.findUnique({
    where: { id: data.classId },
    include: { _count: { select: { students: true } } },
  });

  if (classItem && classItem.capacity === classItem._count.students) {
    return { success: false, error: true };
  }

  try {
    const client = await clerkClient();
    const user = await client.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.student.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        address: data.address,
        img: data.img,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });

    // revalidatePath("/list/student");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const client = await clerkClient();
    const user = await client.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        address: data.address,
        img: data.img,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });

    // revalidatePath("/list/student");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const client = await clerkClient();
    const user = await client.users.deleteUser(id);

    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};
//EXAM...
export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  try {
    if (role === "teacher") {
      const teacherLesson = await prisma.lesson.findFirst({
        where: {
          teacherId: userId!,
          id: data.lessonId,
        },
      });

      if (!teacherLesson) {
        return { success: false, error: true };
      }
    }
    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  try {
    if (role === "teacher") {
      const teacherLesson = await prisma.lesson.findFirst({
        where: {
          teacherId: userId!,
          id: data.lessonId,
        },
      });

      if (!teacherLesson) {
        return { success: false, error: true };
      }
    }

    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  // const { userId, sessionClaims } = await auth();
  // const role = (sessionClaims?.metadat as { role?: string })?.role;

  try {
    await prisma.exam.delete({
      where: {
        id: parseInt(id),
        // ...(role === "teacher" ? { lesson: { teacherId: userId! } } : {}),
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

//demo
                            
export const createParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  try {
    const user = await clerkClient.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "parent" },
    });

    await prisma.parent.create({
      data: {
        id: user.id,
        username: data.username,
        email: data.email || "",
        name: data.name || "",
        surname: data.surname || "",
        phone: data?.phone || "",
        address: data?.address || "",
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("Error creating parent:", err);
    return { success: false, error: true };
  }
};

export const updateParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    await clerkClient.users.updateUser(data.id, {
      username: data.username,
      ...(data.password && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.parent.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        email: data.email || "",
        name: data.name || "",
        surname: data.surname || "",
        phone: data?.phone || "",
        address: data?.address || "",
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("Error updating parent:", err);
    return { success: false, error: true };
  }
};

export const deleteParent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await clerkClient.users.deleteUser(id);

    await prisma.parent.delete({
      where: {
        id: id,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting parent:", err);
    return { success: false, error: true };
  }
};


export const createResult = async (
  data: { studentId: string; subjectId: number; marks: number; grade: string }[]
) => {
  console.log("Function createResult called with data:", data);

  try {
    if (!data || data.length === 0) {
      throw new Error("No data provided for insertion.");
    }

    // Validate if student exists
    const studentExists = await prisma.student.findUnique({
      where: { id: data[0].studentId },
    });

    if (!studentExists) {
      throw new Error(`Student with ID '${data[0].studentId}' not found.`);
    }

    console.log("Student validation passed.");

    // Validate if subjects exist
    const subjectIds = data.map((entry) => entry.subjectId);
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
    });

    if (subjects.length !== subjectIds.length) {
      throw new Error("One or more subject IDs are invalid.");
    }

    console.log("Subject validation passed.");

    // Insert data using Prisma transaction
    const results = await prisma.$transaction(
      data.map((result) =>
        prisma.result.create({
          data: {
            studentId: result.studentId,
            subjectId: result.subjectId, // Keep as number since schema expects number
            marks: result.marks,
            grade: result.grade,
          },
        })
      )
    );

    console.log("Inserted results:", results);
    return { success: true, results };
  } catch (error) {
    console.error("Error creating results:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma Client Error:", error);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Update an existing result
export const updateResult = async (id: number, data: ResultSchema) => {
  try {
    console.log("Updating result with data:", data);
    const result = await prisma.result.update({
      where: { id: id.toString() }, // Ensure id is a string if your schema expects it
      data: {
        studentId: data.studentId,
        subjectId: data.subjects[0].subjectId, // Assuming you want to update the first subject
        marks: data.subjects[0].marks,
      },
    });
    return { success: true, result };
  } catch (error) {
    console.error("Error updating result:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Delete a result
export const deleteResult = async (
  prevState: { success: boolean; error: boolean },
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;

    if (!id) {
      return { success: false, error: true };
    }

    await prisma.result.delete({
      where: {
        id: id, // Use the ID as a string directly
      },
    });

    return { success: true, error: false };
  } catch (error) {
    console.error("Error deleting result:", error);
    return { success: false, error: true };
  }
};


export const createAttendance = async (data: AttendanceSchema) => {
  try {
    const attendance = await prisma.attendance.create({
      data: {
        className: data.className,
        date: new Date(data.date), // Ensure valid Date object
        day: data.day,
        present: data.present,
        total: data.total,
      },
    });
    return { success: true, attendance };
  } catch (error) {
    console.error("Error creating attendance:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const updateAttendance = async (id: number, data: AttendanceSchema) => {
  try {
    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        className: data.className,
        date: new Date(data.date),
        day: data.day,
        present: data.present,
        total: data.total,
      },
    });
    console.log("Updated Attendance:", attendance);
    return { success: true, attendance };
  } catch (error) {
    console.error("Error updating attendance:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const deleteAttendance = async (
  prevState: { success: boolean; error: boolean },
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;

    if (!id) {
      return { success: false, error: true };
    }

    await prisma.attendance.delete({
      where: {
        id: Number(id), // Convert ID to a number
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting attendance:", err);
    return { success: false, error: true };
  }
};