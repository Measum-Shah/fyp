-- PostgreSQL conversion of fyp_erp_db.sql (originally MariaDB/MySQL)
-- Converted from MariaDB 10.11 / phpMyAdmin dump
-- 341 tables, schema-only (no data rows in source)



SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 21, 2026 at 03:07 AM
-- Server version: 10.11.18-MariaDB
-- PHP Version: 8.4.21




--
-- Database: `rootsivy_live`
--

-- --------------------------------------------------------

--
-- Table structure for table `academics_groups`
--

DROP TABLE IF EXISTS "academics_groups" CASCADE;
CREATE TABLE IF NOT EXISTS "academics_groups" (
"id" SERIAL,
"program_id" INTEGER NOT NULL,
"name" varchar(191) NOT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `academics_group_courses`
--

DROP TABLE IF EXISTS "academics_group_courses" CASCADE;
CREATE TABLE IF NOT EXISTS "academics_group_courses" (
"id" SERIAL,
"academics_group_id" INTEGER NOT NULL,
"course_id" INTEGER NOT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `academic_infos`
--

DROP TABLE IF EXISTS "academic_infos" CASCADE;
CREATE TABLE IF NOT EXISTS "academic_infos" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"students_id" INTEGER NOT NULL,
"institution" varchar(100) NOT NULL,
"board" varchar(50) DEFAULT NULL,
"pass_year" varchar(4) NOT NULL,
"symbol_no" varchar(15) DEFAULT NULL,
"percentage" INTEGER NOT NULL,
"division_grade" varchar(10) NOT NULL,
"major_subjects" varchar(50) DEFAULT NULL,
"remark" TEXT DEFAULT NULL,
"sorting_order" INTEGER DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"total_marks" INTEGER DEFAULT NULL,
"obtained_marks" INTEGER DEFAULT NULL,
"qualification" varchar(191) DEFAULT NULL,
"subjects_read" varchar(191) DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `accumulative_report`
--

DROP TABLE IF EXISTS "accumulative_report" CASCADE;
CREATE TABLE IF NOT EXISTS "accumulative_report" (
"id" SERIAL,
"student_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"class_id" INTEGER DEFAULT NULL,
"active_session_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"active_session_section_id" INTEGER DEFAULT NULL,
"status" SMALLINT DEFAULT 1,
"grading_types_id" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `accumulative_report_details`
--

DROP TABLE IF EXISTS "accumulative_report_details" CASCADE;
CREATE TABLE IF NOT EXISTS "accumulative_report_details" (
"id" SERIAL,
"accumulative_report_id" INTEGER DEFAULT NULL,
"subject_id" INTEGER DEFAULT NULL,
"term1_marks" INTEGER DEFAULT NULL,
"term1_total" INTEGER DEFAULT NULL,
"term2_marks" INTEGER DEFAULT NULL,
"term2_total" INTEGER DEFAULT NULL,
"term1_percentage" INTEGER DEFAULT NULL,
"term2_percentage" INTEGER DEFAULT NULL,
"grade" varchar(191) DEFAULT NULL,
"published" SMALLINT DEFAULT 0,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `active_sessions`
--

DROP TABLE IF EXISTS "active_sessions" CASCADE;
CREATE TABLE IF NOT EXISTS "active_sessions" (
"id" SERIAL,
"title" varchar(191) NOT NULL,
"session_id" INTEGER NOT NULL,
"board_id" INTEGER NOT NULL,
"branch_id" INTEGER NOT NULL,
"program_id" INTEGER NOT NULL,
"class_id" INTEGER NOT NULL,
"intake_id" INTEGER DEFAULT NULL,
"status" TEXT NOT NULL DEFAULT 'Active',
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `active_session_sections`
--

DROP TABLE IF EXISTS "active_session_sections" CASCADE;
CREATE TABLE IF NOT EXISTS "active_session_sections" (
"id" SERIAL,
"active_session_id" INTEGER NOT NULL,
"section_id" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `active_session_students`
--

DROP TABLE IF EXISTS "active_session_students" CASCADE;
CREATE TABLE IF NOT EXISTS "active_session_students" (
"id" SERIAL,
"active_session_section_id" INTEGER DEFAULT NULL,
"student_id" INTEGER NOT NULL,
"academics_group_id" INTEGER DEFAULT NULL,
"tuition_fee" INTEGER DEFAULT 0,
"status" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `active_session_teachers`
--

DROP TABLE IF EXISTS "active_session_teachers" CASCADE;
CREATE TABLE IF NOT EXISTS "active_session_teachers" (
"id" SERIAL,
"active_session_section_id" INTEGER NOT NULL,
"staff_id" INTEGER NOT NULL,
"rate_per_lecture" INTEGER DEFAULT NULL,
"course_ids" varchar(191) DEFAULT NULL,
"rates" varchar(191) NOT NULL DEFAULT '0',
"days_in_month" varchar(191) NOT NULL DEFAULT '0',
"class_timetable_id" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"status" INTEGER NOT NULL DEFAULT 1,
"start_date" date DEFAULT NULL,
"end_date" date DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `addressinfos`
--

DROP TABLE IF EXISTS "addressinfos" CASCADE;
CREATE TABLE IF NOT EXISTS "addressinfos" (
"id" SERIAL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"students_id" INTEGER NOT NULL,
"address" TEXT DEFAULT NULL,
"state" TEXT DEFAULT NULL,
"city" TEXT DEFAULT NULL,
"temp_city" varchar(191) DEFAULT NULL,
"country" TEXT DEFAULT NULL,
"temp_address" TEXT DEFAULT NULL,
"temp_state" TEXT DEFAULT NULL,
"temp_country" TEXT DEFAULT NULL,
"home_phone" TEXT DEFAULT NULL,
"mobile_1" TEXT DEFAULT NULL,
"mobile_2" TEXT DEFAULT NULL,
"status" SMALLINT NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `add_goods_branch`
--

DROP TABLE IF EXISTS "add_goods_branch" CASCADE;
CREATE TABLE IF NOT EXISTS "add_goods_branch" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"product_id" INTEGER NOT NULL,
"p_image" BYTEA DEFAULT NULL,
"department_id" INTEGER DEFAULT NULL,
"qty" INTEGER NOT NULL,
"description" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `agendas`
--

DROP TABLE IF EXISTS "agendas" CASCADE;
CREATE TABLE IF NOT EXISTS "agendas" (
"id" SERIAL,
"title" varchar(191) NOT NULL,
"subject" varchar(191) NOT NULL,
"reason" varchar(191) DEFAULT 'No Reason',
"description" varchar(191) NOT NULL,
"status" varchar(191) NOT NULL DEFAULT 'pending',
"created_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"branch_id" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `alert_settings`
--

DROP TABLE IF EXISTS "alert_settings" CASCADE;
CREATE TABLE IF NOT EXISTS "alert_settings" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"event" varchar(100) NOT NULL,
"sms" SMALLINT NOT NULL DEFAULT 1,
"email" SMALLINT NOT NULL DEFAULT 1,
"subject" varchar(100) NOT NULL,
"template" TEXT NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `annual_calendars`
--

DROP TABLE IF EXISTS "annual_calendars" CASCADE;
CREATE TABLE IF NOT EXISTS "annual_calendars" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"title" varchar(250) NOT NULL,
"start" TIMESTAMP DEFAULT NULL,
"end" TIMESTAMP DEFAULT NULL,
"type" TEXT DEFAULT 'National Holiday',
"color" varchar(100) DEFAULT 'green',
"created_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `api_authentication_user`
--

DROP TABLE IF EXISTS "api_authentication_user" CASCADE;
CREATE TABLE IF NOT EXISTS "api_authentication_user" (
"id" SERIAL,
"name" varchar(191) NOT NULL,
"bank_id" INTEGER DEFAULT NULL,
"password" varchar(191) NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `api_payment_transaction`
--

DROP TABLE IF EXISTS "api_payment_transaction" CASCADE;
CREATE TABLE IF NOT EXISTS "api_payment_transaction" (
"id" SERIAL,
"transaction_number" TEXT NOT NULL,
"bill_no" varchar(255) NOT NULL,
"amount" varchar(255) NOT NULL,
"paid_date" date NOT NULL,
"account_no" TEXT NOT NULL,
"email" varchar(255) NOT NULL,
"created_at" TIMESTAMP NOT NULL,
"updated_at" TIMESTAMP NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `approve_agendas`
--

DROP TABLE IF EXISTS "approve_agendas" CASCADE;
CREATE TABLE IF NOT EXISTS "approve_agendas" (
"id" SERIAL,
"date" date NOT NULL,
"time" time NOT NULL,
"location" varchar(191) NOT NULL,
"description" varchar(191) NOT NULL,
"in_campus" INTEGER NOT NULL,
"agenda_request_id" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `assesment_types`
--

DROP TABLE IF EXISTS "assesment_types" CASCADE;
CREATE TABLE IF NOT EXISTS "assesment_types" (
"id" SERIAL,
"name" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `assessments`
--

DROP TABLE IF EXISTS "assessments" CASCADE;
CREATE TABLE IF NOT EXISTS "assessments" (
"id" SERIAL,
"active_session_id" INTEGER DEFAULT NULL,
"active_session_teacher_id" INTEGER DEFAULT NULL,
"active_session_section_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"name" varchar(191) DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"status" INTEGER DEFAULT NULL,
"assesment_type_id" INTEGER DEFAULT NULL,
"sorting_order" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `assets`
--

DROP TABLE IF EXISTS "assets" CASCADE;
CREATE TABLE IF NOT EXISTS "assets" (
"id" SERIAL,
"product_id" INTEGER NOT NULL,
"asset_id" INTEGER NOT NULL,
"products_date" date NOT NULL,
"asset_type" varchar(255) NOT NULL,
"branch_id" INTEGER NOT NULL,
"price" DOUBLE PRECISION NOT NULL,
"month" DOUBLE PRECISION NOT NULL,
"depriciated_amount" DOUBLE PRECISION NOT NULL,
"quantity" DOUBLE PRECISION NOT NULL,
"credit" INTEGER NOT NULL,
"po_number" TEXT NOT NULL,
"serial_number" TEXT NOT NULL,
"warranty_expires" TEXT NOT NULL,
"payment_method" varchar(255) NOT NULL,
"debit" INTEGER NOT NULL,
"vendor_id" INTEGER NOT NULL,
"remarks" TEXT NOT NULL,
"products_description" TEXT NOT NULL,
"created_by" INTEGER NOT NULL,
"updated_by" INTEGER NOT NULL,
"created_at" TIMESTAMP NOT NULL,
"updated_at" TIMESTAMP NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `assets_quantity`
--

DROP TABLE IF EXISTS "assets_quantity" CASCADE;
CREATE TABLE IF NOT EXISTS "assets_quantity" (
"id" SERIAL,
"product_id" INTEGER NOT NULL,
"quantity" INTEGER NOT NULL,
"branch_id" INTEGER NOT NULL,
"department_id" INTEGER NOT NULL,
"assigned_assets" INTEGER NOT NULL,
"unassigned_assets" INTEGER NOT NULL,
"created_by" INTEGER NOT NULL,
"updated_by" INTEGER NOT NULL,
"created_at" TIMESTAMP NOT NULL,
"updated_at" TIMESTAMP NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `assets_type`
--

DROP TABLE IF EXISTS "assets_type" CASCADE;
CREATE TABLE IF NOT EXISTS "assets_type" (
"id" SERIAL,
"name" varchar(255) NOT NULL,
"created_by" INTEGER NOT NULL,
"updated_by" INTEGER NOT NULL,
"created_at" TIMESTAMP NOT NULL,
"updated_at" TIMESTAMP NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `assignments`
--

DROP TABLE IF EXISTS "assignments" CASCADE;
CREATE TABLE IF NOT EXISTS "assignments" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"years_id" INTEGER DEFAULT NULL,
"faculty" INTEGER DEFAULT NULL,
"semesters_id" INTEGER DEFAULT NULL,
"subjects_id" INTEGER DEFAULT NULL,
"category" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"board_id" INTEGER NOT NULL,
"program_id" INTEGER NOT NULL,
"class_id" INTEGER NOT NULL,
"section_id" INTEGER NOT NULL,
"intake_id" INTEGER NOT NULL,
"publish_date" date DEFAULT NULL,
"end_date" date DEFAULT NULL,
"total_marks" INTEGER DEFAULT NULL,
"title" varchar(100) DEFAULT NULL,
"description" TEXT DEFAULT NULL,
"file" TEXT DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"term_id" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `assignment_answers`
--

DROP TABLE IF EXISTS "assignment_answers" CASCADE;
CREATE TABLE IF NOT EXISTS "assignment_answers" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"exam_schedule_id" INTEGER NOT NULL,
"exam_schedule_detail_id" INTEGER NOT NULL,
"assignments_id" INTEGER DEFAULT 0,
"session_id" INTEGER DEFAULT NULL,
"students_id" INTEGER NOT NULL,
"branch_id" INTEGER DEFAULT NULL,
"answer_text" TEXT NOT NULL,
"file" TEXT DEFAULT NULL,
"obtained_marks" INTEGER DEFAULT NULL,
"approve_status" SMALLINT DEFAULT NULL,
"marking_status" INTEGER DEFAULT 0,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `assign_active_session_course_lab`
--

DROP TABLE IF EXISTS "assign_active_session_course_lab" CASCADE;
CREATE TABLE IF NOT EXISTS "assign_active_session_course_lab" (
"id" SERIAL,
"active_session_id" INTEGER DEFAULT NULL,
"course_id" INTEGER DEFAULT NULL,
"lab_id" INTEGER DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"status" TEXT NOT NULL DEFAULT 'Active',
"price" INTEGER NOT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `assign_class_section`
--

DROP TABLE IF EXISTS "assign_class_section" CASCADE;
CREATE TABLE IF NOT EXISTS "assign_class_section" (
"id" SERIAL,
"board_program_class_id" INTEGER NOT NULL,
"section_id" INTEGER NOT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `assingment_student_data`
--

DROP TABLE IF EXISTS "assingment_student_data" CASCADE;
CREATE TABLE IF NOT EXISTS "assingment_student_data" (
"id" SERIAL,
"student_id" INTEGER DEFAULT NULL,
"exam_schedule_id" INTEGER DEFAULT NULL,
"file" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `attendances`
--

DROP TABLE IF EXISTS "attendances" CASCADE;
CREATE TABLE IF NOT EXISTS "attendances" (
"id" SERIAL,
"session_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"attendees_type" INTEGER NOT NULL,
"link_id" INTEGER NOT NULL,
"years_id" INTEGER NOT NULL,
"months_id" INTEGER NOT NULL,
"day_1" INTEGER NOT NULL DEFAULT 0,
"day_2" INTEGER NOT NULL DEFAULT 0,
"day_3" INTEGER NOT NULL DEFAULT 0,
"day_4" INTEGER NOT NULL DEFAULT 0,
"day_5" INTEGER NOT NULL DEFAULT 0,
"day_6" INTEGER NOT NULL DEFAULT 0,
"day_7" INTEGER NOT NULL DEFAULT 0,
"day_8" INTEGER NOT NULL DEFAULT 0,
"day_9" INTEGER NOT NULL DEFAULT 0,
"day_10" INTEGER NOT NULL DEFAULT 0,
"day_11" INTEGER NOT NULL DEFAULT 0,
"day_12" INTEGER NOT NULL DEFAULT 0,
"day_13" INTEGER NOT NULL DEFAULT 0,
"day_14" INTEGER NOT NULL DEFAULT 0,
"day_15" INTEGER NOT NULL DEFAULT 0,
"day_16" INTEGER NOT NULL DEFAULT 0,
"day_17" INTEGER NOT NULL DEFAULT 0,
"day_18" INTEGER NOT NULL DEFAULT 0,
"day_19" INTEGER NOT NULL DEFAULT 0,
"day_20" INTEGER NOT NULL DEFAULT 0,
"day_21" INTEGER NOT NULL DEFAULT 0,
"day_22" INTEGER NOT NULL DEFAULT 0,
"day_23" INTEGER NOT NULL DEFAULT 0,
"day_24" INTEGER NOT NULL DEFAULT 0,
"day_25" INTEGER NOT NULL DEFAULT 0,
"day_26" INTEGER NOT NULL DEFAULT 0,
"day_27" INTEGER NOT NULL DEFAULT 0,
"day_28" INTEGER NOT NULL DEFAULT 0,
"day_29" INTEGER NOT NULL DEFAULT 0,
"day_30" INTEGER NOT NULL DEFAULT 0,
"day_31" INTEGER NOT NULL DEFAULT 0,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `attendance_masters`
--

DROP TABLE IF EXISTS "attendance_masters" CASCADE;
CREATE TABLE IF NOT EXISTS "attendance_masters" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"year" INTEGER NOT NULL,
"month" INTEGER NOT NULL,
"day_in_month" INTEGER NOT NULL,
"holiday" INTEGER NOT NULL,
"open" INTEGER NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `attendance_statuses`
--

DROP TABLE IF EXISTS "attendance_statuses" CASCADE;
CREATE TABLE IF NOT EXISTS "attendance_statuses" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"title" varchar(25) NOT NULL,
"display_class" varchar(15) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `attendance_summary`
--

DROP TABLE IF EXISTS "attendance_summary" CASCADE;
CREATE TABLE IF NOT EXISTS "attendance_summary" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"staff_id" INTEGER NOT NULL,
"month_id" INTEGER NOT NULL,
"year_id" INTEGER NOT NULL,
"total_absents" INTEGER DEFAULT 0,
"remarks" TEXT DEFAULT NULL,
"pay_status" varchar(255) NOT NULL,
"approved_status" varchar(255) DEFAULT 'Pending',
"approved_by" varchar(255) DEFAULT 'Pending',
"created_by" INTEGER NOT NULL,
"updated_by" INTEGER NOT NULL,
"created_at" TIMESTAMP NOT NULL,
"updated_at" TIMESTAMP NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `attendance__payrolls`
--

DROP TABLE IF EXISTS "attendance__payrolls" CASCADE;
CREATE TABLE IF NOT EXISTS "attendance__payrolls" (
"id" SERIAL,
"active_session_teacher_id" INTEGER NOT NULL,
"class_Date" date NOT NULL,
"class_time" time NOT NULL,
"day" TEXT NOT NULL,
"attendance" INTEGER NOT NULL,
"teacher_id" varchar(191) NOT NULL,
"subject_id" varchar(191) DEFAULT NULL,
"class_id" varchar(191) DEFAULT NULL,
"board" varchar(191) DEFAULT NULL,
"program" varchar(191) DEFAULT NULL,
"subject_scheduled_time" varchar(191) NOT NULL,
"attendance_type" varchar(191) NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `bank_account_request`
--

DROP TABLE IF EXISTS "bank_account_request" CASCADE;
CREATE TABLE IF NOT EXISTS "bank_account_request" (
"id" SERIAL,
"staff_id" varchar(191) NOT NULL,
"first_name" varchar(191) NOT NULL,
"last_name" varchar(191) NOT NULL,
"cnic" varchar(191) NOT NULL,
"father_name" varchar(191) NOT NULL,
"joining_date" date NOT NULL,
"designation" varchar(191) NOT NULL,
"branch" varchar(191) NOT NULL,
"salary" INTEGER NOT NULL,
"form" varchar(191) NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `boards`
--

DROP TABLE IF EXISTS "boards" CASCADE;
CREATE TABLE IF NOT EXISTS "boards" (
"id" SERIAL,
"name" varchar(191) NOT NULL,
"status" TEXT NOT NULL DEFAULT 'Active',
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"board" varchar(191) DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `board_programs`
--

DROP TABLE IF EXISTS "board_programs" CASCADE;
CREATE TABLE IF NOT EXISTS "board_programs" (
"id" SERIAL,
"board_id" INTEGER NOT NULL,
"program_id" INTEGER NOT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `books`
--

DROP TABLE IF EXISTS "books" CASCADE;
CREATE TABLE IF NOT EXISTS "books" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"book_masters_id" INTEGER NOT NULL,
"book_code" varchar(100) NOT NULL,
"book_status" INTEGER NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `book_categories`
--

DROP TABLE IF EXISTS "book_categories" CASCADE;
CREATE TABLE IF NOT EXISTS "book_categories" (
"id" SERIAL,
"title" varchar(100) NOT NULL,
"slug" varchar(100) NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `book_issues`
--

DROP TABLE IF EXISTS "book_issues" CASCADE;
CREATE TABLE IF NOT EXISTS "book_issues" (
"id" SERIAL,
"member_id" INTEGER NOT NULL,
"book_id" INTEGER NOT NULL,
"issued_on" TIMESTAMP NOT NULL,
"damage_return_fine" INTEGER DEFAULT NULL,
"due_date" TIMESTAMP NOT NULL,
"return_date" TIMESTAMP DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `book_masters`
--

DROP TABLE IF EXISTS "book_masters" CASCADE;
CREATE TABLE IF NOT EXISTS "book_masters" (
"id" SERIAL,
"isbn_number" varchar(25) DEFAULT NULL,
"code" varchar(15) DEFAULT NULL,
"title" varchar(100) DEFAULT NULL,
"sub_title" varchar(100) DEFAULT NULL,
"image" TEXT DEFAULT NULL,
"language" varchar(100) DEFAULT NULL,
"editor" varchar(100) DEFAULT NULL,
"categories" varchar(100) DEFAULT NULL,
"edition" varchar(100) DEFAULT NULL,
"edition_year" varchar(100) DEFAULT NULL,
"publisher" varchar(100) DEFAULT NULL,
"publish_year" varchar(100) DEFAULT NULL,
"series" varchar(100) DEFAULT NULL,
"author" varchar(100) NOT NULL,
"rack_location" varchar(100) DEFAULT NULL,
"price" varchar(100) NOT NULL,
"total_pages" varchar(100) DEFAULT NULL,
"source" varchar(100) DEFAULT NULL,
"notes" varchar(100) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `book_status`
--

DROP TABLE IF EXISTS "book_status" CASCADE;
CREATE TABLE IF NOT EXISTS "book_status" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"title" varchar(25) DEFAULT NULL,
"display_class" varchar(191) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `book_statuses`
--

DROP TABLE IF EXISTS "book_statuses" CASCADE;
CREATE TABLE IF NOT EXISTS "book_statuses" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"title" varchar(25) NOT NULL,
"display_class" varchar(15) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `bpc_term`
--

DROP TABLE IF EXISTS "bpc_term" CASCADE;
CREATE TABLE IF NOT EXISTS "bpc_term" (
"id" SERIAL,
"bpc_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"board_id" INTEGER NOT NULL,
"program_id" INTEGER NOT NULL,
"class_id" INTEGER NOT NULL,
"term_id" INTEGER DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"intake_id" INTEGER NOT NULL,
"session_id" INTEGER NOT NULL,
"date_from" date NOT NULL,
"date_to" date NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `branch_board_program`
--

DROP TABLE IF EXISTS "branch_board_program" CASCADE;
CREATE TABLE IF NOT EXISTS "branch_board_program" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"board_id" INTEGER NOT NULL,
"program_id" INTEGER NOT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `branch_departments`
--

DROP TABLE IF EXISTS "branch_departments" CASCADE;
CREATE TABLE IF NOT EXISTS "branch_departments" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"department_id" INTEGER NOT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `brand`
--

DROP TABLE IF EXISTS "brand" CASCADE;
CREATE TABLE IF NOT EXISTS "brand" (
"id" SERIAL,
"name" varchar(191) NOT NULL,
"created_by" INTEGER NOT NULL,
"updated_by" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"description" varchar(200) NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `buildings`
--

DROP TABLE IF EXISTS "buildings" CASCADE;
CREATE TABLE IF NOT EXISTS "buildings" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"name" varchar(191) NOT NULL,
"status" TEXT NOT NULL DEFAULT 'Active',
"description" varchar(191) DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `candidate_form`
--

DROP TABLE IF EXISTS "candidate_form" CASCADE;
CREATE TABLE IF NOT EXISTS "candidate_form" (
"id" SERIAL,
"job_post_id" INTEGER NOT NULL,
"name" varchar(191) NOT NULL,
"education" varchar(191) NOT NULL,
"experience" varchar(191) NOT NULL,
"gender" varchar(191) NOT NULL,
"expected_salary" INTEGER NOT NULL,
"cv" varchar(191) NOT NULL,
"cover_letter" varchar(191) DEFAULT NULL,
"phone" varchar(191) NOT NULL,
"email" varchar(191) NOT NULL,
"cnic" varchar(191) DEFAULT NULL,
"domicile" varchar(191) DEFAULT NULL,
"passport" varchar(191) DEFAULT NULL,
"passport_size_photo" varchar(191) DEFAULT NULL,
"degree" varchar(191) DEFAULT NULL,
"awards" varchar(191) DEFAULT NULL,
"recommendation_letter" varchar(191) DEFAULT NULL,
"experience_letter" varchar(191) DEFAULT NULL,
"user_id" varchar(191) DEFAULT NULL,
"expected_joining" date NOT NULL,
"status" TEXT NOT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS "category" CASCADE;
CREATE TABLE IF NOT EXISTS "category" (
"id" SERIAL,
"name" varchar(191) NOT NULL,
"created_by" INTEGER NOT NULL,
"updated_by" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"description" varchar(200) NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `child_benefit_configs`
--

DROP TABLE IF EXISTS "child_benefit_configs" CASCADE;
CREATE TABLE IF NOT EXISTS "child_benefit_configs" (
"id" SERIAL,
"child_name" varchar(191) DEFAULT NULL,
"discount" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `child_benefit_fee_heads_discount`
--

DROP TABLE IF EXISTS "child_benefit_fee_heads_discount" CASCADE;
CREATE TABLE IF NOT EXISTS "child_benefit_fee_heads_discount" (
"id" SERIAL,
"staff_id" INTEGER NOT NULL,
"student_id" INTEGER NOT NULL,
"fee_head_id" INTEGER NOT NULL,
"fee_amount" INTEGER NOT NULL DEFAULT 0,
"discount" varchar(191) DEFAULT NULL,
"after_discount" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 0
);


-- --------------------------------------------------------

--
-- Table structure for table `child_benefit_management`
--

DROP TABLE IF EXISTS "child_benefit_management" CASCADE;
CREATE TABLE IF NOT EXISTS "child_benefit_management" (
"id" SERIAL,
"staff_id" INTEGER DEFAULT NULL,
"student_child_id" INTEGER DEFAULT NULL,
"applicatant_cb_reason" varchar(191) DEFAULT NULL,
"ceo_approval" varchar(191) DEFAULT NULL,
"ceo_additional_reasons" varchar(191) DEFAULT NULL,
"hr_approval" varchar(191) DEFAULT NULL,
"hr_disapproval_reason" varchar(191) DEFAULT NULL,
"dfit_approval" varchar(191) DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"fee_head_id" INTEGER DEFAULT NULL,
"fee_head_discount" INTEGER DEFAULT NULL,
"staff_cb_appiled_status" varchar(191) DEFAULT NULL,
"fee_amount" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `child_benefit_students`
--

DROP TABLE IF EXISTS "child_benefit_students" CASCADE;
CREATE TABLE IF NOT EXISTS "child_benefit_students" (
"id" SERIAL,
"staff_id" INTEGER DEFAULT NULL,
"student_id" INTEGER DEFAULT NULL,
"child_benefit_config_id" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS "classes" CASCADE;
CREATE TABLE IF NOT EXISTS "classes" (
"id" SERIAL,
"name" varchar(191) NOT NULL,
"class_code" varchar(255) NOT NULL,
"description" varchar(191) NOT NULL,
"status" TEXT NOT NULL DEFAULT 'Active',
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `class_notice`
--

DROP TABLE IF EXISTS "class_notice" CASCADE;
CREATE TABLE IF NOT EXISTS "class_notice" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"class_id" INTEGER DEFAULT NULL,
"section_id" INTEGER DEFAULT NULL,
"title" varchar(100) DEFAULT NULL,
"program_id" INTEGER NOT NULL,
"board_id" INTEGER NOT NULL,
"intake_id" INTEGER NOT NULL,
"session_id" INTEGER NOT NULL,
"message" TEXT DEFAULT NULL,
"publish_date" date DEFAULT NULL,
"end_date" date DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `class_time_tables`
--

DROP TABLE IF EXISTS "class_time_tables" CASCADE;
CREATE TABLE IF NOT EXISTS "class_time_tables" (
"id" SERIAL,
"time_table_id" INTEGER NOT NULL,
"time_table_slot_id" INTEGER DEFAULT NULL,
"room_id" INTEGER DEFAULT NULL,
"active_session_section_id" INTEGER NOT NULL,
"subject_id" INTEGER NOT NULL,
"teacher_id" INTEGER NOT NULL,
"day" varchar(191) NOT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS "comments" CASCADE;
CREATE TABLE IF NOT EXISTS "comments" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"board_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"class_id" INTEGER DEFAULT NULL,
"section_id" INTEGER DEFAULT NULL,
"member_type" varchar(8) NOT NULL,
"member_id" INTEGER NOT NULL,
"behavior" TEXT NOT NULL,
"performance" TEXT DEFAULT NULL,
"other_activity" TEXT DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `compulsory_courses`
--

DROP TABLE IF EXISTS "compulsory_courses" CASCADE;
CREATE TABLE IF NOT EXISTS "compulsory_courses" (
"id" SERIAL,
"program_id" INTEGER NOT NULL,
"course_id" INTEGER NOT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `corrections`
--

DROP TABLE IF EXISTS "corrections" CASCADE;
CREATE TABLE IF NOT EXISTS "corrections" (
"id" SERIAL,
"gurardian_id" INTEGER DEFAULT NULL,
"student_id" INTEGER DEFAULT NULL,
"s_full_name" SMALLINT NOT NULL DEFAULT 0,
"s_dob" SMALLINT NOT NULL DEFAULT 0,
"s_home_address" SMALLINT NOT NULL DEFAULT 0,
"s_previous_institute" SMALLINT NOT NULL DEFAULT 0,
"s_city" SMALLINT NOT NULL DEFAULT 0,
"s_province" SMALLINT NOT NULL DEFAULT 0,
"s_country" SMALLINT NOT NULL DEFAULT 0,
"s_nationalty" SMALLINT NOT NULL DEFAULT 0,
"pos_address_previous_institute" SMALLINT NOT NULL DEFAULT 0,
"g_full_name" SMALLINT NOT NULL DEFAULT 0,
"g_cnic" SMALLINT NOT NULL DEFAULT 0,
"mother_full_name" SMALLINT NOT NULL DEFAULT 0,
"g_home_address" SMALLINT NOT NULL DEFAULT 0,
"g_employ_name" SMALLINT NOT NULL DEFAULT 0,
"mother_mobile_n" SMALLINT NOT NULL DEFAULT 0,
"g_city" SMALLINT NOT NULL DEFAULT 0,
"g_province" SMALLINT NOT NULL DEFAULT 0,
"g_country" SMALLINT NOT NULL DEFAULT 0,
"g_nationalty" SMALLINT NOT NULL DEFAULT 0,
"g_employ_designation" SMALLINT NOT NULL DEFAULT 0,
"g_employer_mob_n" SMALLINT NOT NULL DEFAULT 0,
"application_status" SMALLINT NOT NULL DEFAULT 1,
"approved_principle" SMALLINT NOT NULL DEFAULT 0,
"approved_adminstrator" SMALLINT NOT NULL DEFAULT 0,
"created_by" INTEGER DEFAULT NULL,
"correction_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `correction_details`
--

DROP TABLE IF EXISTS "correction_details" CASCADE;
CREATE TABLE IF NOT EXISTS "correction_details" (
"id" SERIAL,
"wrong_information_id" INTEGER NOT NULL,
"s_name" varchar(191) DEFAULT NULL,
"s_dob" date DEFAULT NULL,
"s_home_address" varchar(191) DEFAULT NULL,
"s_previous_institute" varchar(191) DEFAULT NULL,
"s_city" varchar(191) DEFAULT NULL,
"s_province" varchar(191) DEFAULT NULL,
"s_country" varchar(191) DEFAULT NULL,
"s_nationalty" varchar(191) DEFAULT NULL,
"pos_address_previous_institute" varchar(191) DEFAULT NULL,
"g_full_name" varchar(191) DEFAULT NULL,
"g_cnic" varchar(191) DEFAULT NULL,
"mother_full_name" varchar(191) DEFAULT NULL,
"g_home_address" varchar(191) DEFAULT NULL,
"g_employ_name" varchar(191) DEFAULT NULL,
"mother_mobile_n" varchar(191) DEFAULT NULL,
"g_city" varchar(191) DEFAULT NULL,
"g_province" varchar(191) DEFAULT NULL,
"g_country" varchar(191) DEFAULT NULL,
"g_nationalty" varchar(191) DEFAULT NULL,
"g_employ_designation" varchar(191) DEFAULT NULL,
"g_employer_mob_n" varchar(191) DEFAULT NULL,
"application_status" varchar(191) NOT NULL DEFAULT '0',
"approved_principle" SMALLINT NOT NULL DEFAULT 0,
"approved_adminstrator" SMALLINT NOT NULL DEFAULT 0,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS "courses" CASCADE;
CREATE TABLE IF NOT EXISTS "courses" (
"id" SERIAL,
"program_id" INTEGER DEFAULT NULL,
"name" varchar(191) DEFAULT NULL,
"subject_code" varchar(191) DEFAULT NULL,
"credit_hours" INTEGER DEFAULT NULL,
"actual_fee" INTEGER DEFAULT NULL,
"subject_fee" INTEGER DEFAULT NULL,
"subject_optional_code" varchar(191) DEFAULT NULL,
"type" varchar(191) DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"session_details" varchar(255) DEFAULT '0',
"status" TEXT NOT NULL DEFAULT 'Active',
"coursetype_id" INTEGER DEFAULT NULL,
"class_id" INTEGER DEFAULT NULL,
"created_at" date DEFAULT NULL,
"updated_at" date DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `course_types`
--

DROP TABLE IF EXISTS "course_types" CASCADE;
CREATE TABLE IF NOT EXISTS "course_types" (
"id" SERIAL,
"name" varchar(191) DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `curriculum`
--

DROP TABLE IF EXISTS "curriculum" CASCADE;
CREATE TABLE IF NOT EXISTS "curriculum" (
"id" SERIAL,
"title" varchar(191) DEFAULT NULL,
"syllabus_id" INTEGER NOT NULL,
"term_id" INTEGER NOT NULL,
"description" varchar(191) DEFAULT NULL,
"file" varchar(191) DEFAULT NULL,
"status" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `curriculum_details`
--

DROP TABLE IF EXISTS "curriculum_details" CASCADE;
CREATE TABLE IF NOT EXISTS "curriculum_details" (
"id" SERIAL,
"curriculum_id" INTEGER DEFAULT NULL,
"month" varchar(191) DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"approved" SMALLINT DEFAULT 0,
"session_id" INTEGER DEFAULT NULL,
"status" SMALLINT DEFAULT 1,
"created_at" INTEGER DEFAULT NULL,
"updated_at" INTEGER DEFAULT NULL,
"year_id" INTEGER NOT NULL DEFAULT 2023
);


-- --------------------------------------------------------

--
-- Table structure for table `date_sheet`
--

DROP TABLE IF EXISTS "date_sheet" CASCADE;
CREATE TABLE IF NOT EXISTS "date_sheet" (
"id" SERIAL,
"syllabus_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"class_id" INTEGER DEFAULT NULL,
"term_id" INTEGER DEFAULT NULL,
"teacher_id" INTEGER DEFAULT NULL,
"room_id" INTEGER DEFAULT NULL,
"section_id" INTEGER DEFAULT NULL,
"start_date" date DEFAULT NULL,
"end_date" date DEFAULT NULL,
"subject_id" INTEGER DEFAULT NULL,
"start_time" time DEFAULT NULL,
"end_time" time DEFAULT NULL,
"exam_title" varchar(191) DEFAULT NULL,
"file" varchar(191) DEFAULT NULL,
"syllabus_file" varchar(191) DEFAULT NULL,
"status" INTEGER NOT NULL DEFAULT 0,
"publish_status" INTEGER DEFAULT 0,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `days`
--

DROP TABLE IF EXISTS "days" CASCADE;
CREATE TABLE IF NOT EXISTS "days" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"title" varchar(10) NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS "departments" CASCADE;
CREATE TABLE IF NOT EXISTS "departments" (
"id" SERIAL,
"name" varchar(191) NOT NULL,
"description" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `designation`
--

DROP TABLE IF EXISTS "designation" CASCADE;
CREATE TABLE IF NOT EXISTS "designation" (
"id" SERIAL,
"name" varchar(255) NOT NULL,
"parent_id" INTEGER NOT NULL DEFAULT 0,
"created_by" INTEGER NOT NULL,
"updated_by" INTEGER NOT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `devices`
--

DROP TABLE IF EXISTS "devices" CASCADE;
CREATE TABLE IF NOT EXISTS "devices" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"device_no" varchar(191) DEFAULT NULL,
"ip_address" varchar(191) DEFAULT NULL,
"port" varchar(191) DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `diary`
--

DROP TABLE IF EXISTS "diary" CASCADE;
CREATE TABLE IF NOT EXISTS "diary" (
"id" SERIAL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"active_session_section_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"class_id" INTEGER DEFAULT NULL,
"section_id" INTEGER DEFAULT NULL,
"term_id" INTEGER DEFAULT NULL,
"intake_id" INTEGER NOT NULL,
"semester_id" INTEGER DEFAULT NULL,
"category" INTEGER DEFAULT NULL,
"faculty" INTEGER DEFAULT NULL,
"subject_id" INTEGER DEFAULT NULL,
"file" varchar(191) DEFAULT NULL,
"publish_date" date DEFAULT NULL,
"end_date" date DEFAULT NULL,
"description" varchar(255) DEFAULT NULL,
"status" SMALLINT DEFAULT 1,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `discount_types`
--

DROP TABLE IF EXISTS "discount_types" CASCADE;
CREATE TABLE IF NOT EXISTS "discount_types" (
"id" SERIAL,
"name" varchar(191) NOT NULL,
"description" varchar(191) NOT NULL,
"percentage" INTEGER NOT NULL,
"status" TEXT NOT NULL DEFAULT 'Active',
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS "documents" CASCADE;
CREATE TABLE IF NOT EXISTS "documents" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"member_type" varchar(191) NOT NULL,
"staff_id" INTEGER NOT NULL,
"title" varchar(191) NOT NULL,
"file" varchar(191) NOT NULL,
"description" varchar(191) NOT NULL,
"status" INTEGER NOT NULL,
"created_by" INTEGER DEFAULT NULL,
"created_for" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `downloads`
--

DROP TABLE IF EXISTS "downloads" CASCADE;
CREATE TABLE IF NOT EXISTS "downloads" (
"id" SERIAL,
"program_id" INTEGER NOT NULL,
"branch_id" INTEGER NOT NULL,
"board_id" INTEGER DEFAULT NULL,
"class_id" INTEGER NOT NULL,
"semester_id" INTEGER DEFAULT NULL,
"subject_id" INTEGER DEFAULT NULL,
"faculity" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"section_id" INTEGER NOT NULL,
"active_session_id" INTEGER NOT NULL,
"title" varchar(191) DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"file" varchar(191) DEFAULT NULL,
"status" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `ec_timetables`
--

DROP TABLE IF EXISTS "ec_timetables" CASCADE;
CREATE TABLE IF NOT EXISTS "ec_timetables" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"branch_id" INTEGER NOT NULL,
"group_categories_id" INTEGER NOT NULL,
"title" varchar(250) NOT NULL,
"start" TIMESTAMP NOT NULL,
"end" TIMESTAMP NOT NULL,
"color" varchar(20) NOT NULL,
"description" varchar(250) NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `email_settings`
--

DROP TABLE IF EXISTS "email_settings" CASCADE;
CREATE TABLE IF NOT EXISTS "email_settings" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"driver" varchar(100) NOT NULL,
"host" varchar(100) NOT NULL,
"port" varchar(10) NOT NULL,
"user_name" varchar(50) NOT NULL,
"password" varchar(50) NOT NULL,
"encryption" varchar(100) NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `employee_attendance`
--

DROP TABLE IF EXISTS "employee_attendance" CASCADE;
CREATE TABLE IF NOT EXISTS "employee_attendance" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"employee_id" INTEGER DEFAULT NULL,
"attendance_date" date DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"timeIn" time DEFAULT NULL,
"timeOut" time DEFAULT NULL,
"remarks" TEXT DEFAULT NULL,
"comment" TEXT DEFAULT NULL,
"machine_status" SMALLINT NOT NULL DEFAULT 0,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"approve_reject_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `entry_types`
--

DROP TABLE IF EXISTS "entry_types" CASCADE;
CREATE TABLE IF NOT EXISTS "entry_types" (
"id" SERIAL,
"name" varchar(255) NOT NULL,
"code" varchar(3) NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `eobi_epf_register`
--

DROP TABLE IF EXISTS "eobi_epf_register" CASCADE;
CREATE TABLE IF NOT EXISTS "eobi_epf_register" (
"id" SERIAL,
"staff_id" INTEGER NOT NULL,
"branch_id" INTEGER DEFAULT NULL,
"company_id" INTEGER DEFAULT NULL,
"amount" INTEGER NOT NULL,
"status" TEXT DEFAULT NULL,
"month" varchar(191) DEFAULT NULL,
"year" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- --------------------------------------------------------

--
-- Table structure for table `eobi_notifications`
--

DROP TABLE IF EXISTS "eobi_notifications" CASCADE;
CREATE TABLE IF NOT EXISTS "eobi_notifications" (
"id" SERIAL,
"name" varchar(191) DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"date" date DEFAULT NULL,
"amount" INTEGER NOT NULL,
"company_share" INTEGER NOT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_academic_year`
--

DROP TABLE IF EXISTS "erp_academic_year" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_academic_year" (
"id" SERIAL,
"session_id" INTEGER NOT NULL,
"name" varchar(255) NOT NULL,
"start_month" varchar(191) NOT NULL,
"end_month" varchar(191) NOT NULL,
"start_year" varchar(191) NOT NULL,
"end_year" varchar(191) NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_account_types`
--

DROP TABLE IF EXISTS "erp_account_types" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_account_types" (
"id" SERIAL,
"name" varchar(255) NOT NULL,
"code" varchar(1) NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_attendances`
--

DROP TABLE IF EXISTS "erp_attendances" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_attendances" (
"id" SERIAL,
"session_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"attendees_type" INTEGER NOT NULL,
"link_id" INTEGER NOT NULL,
"years_id" INTEGER NOT NULL,
"months_id" INTEGER NOT NULL,
"day_1" INTEGER NOT NULL DEFAULT 0,
"day_2" INTEGER NOT NULL DEFAULT 0,
"day_3" INTEGER NOT NULL DEFAULT 0,
"day_4" INTEGER NOT NULL DEFAULT 0,
"day_5" INTEGER NOT NULL DEFAULT 0,
"day_6" INTEGER NOT NULL DEFAULT 0,
"day_7" INTEGER NOT NULL DEFAULT 0,
"day_8" INTEGER NOT NULL DEFAULT 0,
"day_9" INTEGER NOT NULL DEFAULT 0,
"day_10" INTEGER NOT NULL DEFAULT 0,
"day_11" INTEGER NOT NULL DEFAULT 0,
"day_12" INTEGER NOT NULL DEFAULT 0,
"day_13" INTEGER NOT NULL DEFAULT 0,
"day_14" INTEGER NOT NULL DEFAULT 0,
"day_15" INTEGER NOT NULL DEFAULT 0,
"day_16" INTEGER NOT NULL DEFAULT 0,
"day_17" INTEGER NOT NULL DEFAULT 0,
"day_18" INTEGER NOT NULL DEFAULT 0,
"day_19" INTEGER NOT NULL DEFAULT 0,
"day_20" INTEGER NOT NULL DEFAULT 0,
"day_21" INTEGER NOT NULL DEFAULT 0,
"day_22" INTEGER NOT NULL DEFAULT 0,
"day_23" INTEGER NOT NULL DEFAULT 0,
"day_24" INTEGER NOT NULL DEFAULT 0,
"day_25" INTEGER NOT NULL DEFAULT 0,
"day_26" INTEGER NOT NULL DEFAULT 0,
"day_27" INTEGER NOT NULL DEFAULT 0,
"day_28" INTEGER NOT NULL DEFAULT 0,
"day_29" INTEGER NOT NULL DEFAULT 0,
"day_30" INTEGER NOT NULL DEFAULT 0,
"day_31" INTEGER NOT NULL DEFAULT 0,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_attendance_logs`
--

DROP TABLE IF EXISTS "erp_attendance_logs" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_attendance_logs" (
"log_id" INTEGER NOT NULL,
"device_id" INTEGER NOT NULL,
"branch_id" INTEGER NOT NULL,
"user_id" INTEGER NOT NULL,
"status" varchar(255) NOT NULL,
"date" date NOT NULL,
"time" time NOT NULL,
"updated_at" date NOT NULL,
"created_at" date NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_attendance_masters`
--

DROP TABLE IF EXISTS "erp_attendance_masters" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_attendance_masters" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"year" INTEGER NOT NULL,
"month" INTEGER NOT NULL,
"day_in_month" INTEGER NOT NULL,
"holiday" INTEGER NOT NULL,
"open" INTEGER NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_attendance_statuses`
--

DROP TABLE IF EXISTS "erp_attendance_statuses" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_attendance_statuses" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"title" varchar(25) NOT NULL,
"display_class" varchar(15) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_bankdetail`
--

DROP TABLE IF EXISTS "erp_bankdetail" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_bankdetail" (
"id" SERIAL,
"group_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"accountType" varchar(191) DEFAULT NULL,
"acc_type" INTEGER DEFAULT NULL,
"bank_id" INTEGER DEFAULT NULL,
"account_no" varchar(100) DEFAULT NULL,
"bank_address" varchar(255) DEFAULT NULL,
"branch_code" varchar(100) DEFAULT NULL,
"phone_no" varchar(30) DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"city_id" INTEGER DEFAULT 0,
"contact_person" varchar(191) DEFAULT NULL,
"type" varchar(191) DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_banks`
--

DROP TABLE IF EXISTS "erp_banks" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_banks" (
"id" SERIAL,
"bank_name" varchar(100) NOT NULL,
"type" varchar(191) DEFAULT NULL,
"bene_bank_code" varchar(255) DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"bank_logo" TEXT DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_bank_loan`
--

DROP TABLE IF EXISTS "erp_bank_loan" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_bank_loan" (
"id" SERIAL,
"bank_id" INTEGER DEFAULT NULL,
"amount" INTEGER DEFAULT NULL,
"markup" varchar(191) DEFAULT NULL,
"installment_plan" varchar(191) DEFAULT NULL,
"deduction_each_month" INTEGER DEFAULT NULL,
"kabis" varchar(191) DEFAULT NULL,
"bank_intrest" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ,
"updated_at" INTEGER NOT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"company_id" INTEGER DEFAULT NULL,
"loan_installment_id" INTEGER DEFAULT NULL,
"loan_type_id" INTEGER DEFAULT NULL,
"insurance_amount" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_bank_reconcilation`
--

DROP TABLE IF EXISTS "erp_bank_reconcilation" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_bank_reconcilation" (
"id" SERIAL,
"bank_ledger_id" INTEGER NOT NULL,
"date" date NOT NULL,
"amount" varchar(255) NOT NULL,
"status" INTEGER NOT NULL,
"created_at" date NOT NULL,
"updated_at" date NOT NULL,
"description" INTEGER NOT NULL,
"bank_import_type" INTEGER NOT NULL,
"sheet_code" INTEGER DEFAULT NULL,
"fee_type" varchar(191) DEFAULT NULL,
"fee_status" varchar(255) NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_branches`
--

DROP TABLE IF EXISTS "erp_branches" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_branches" (
"id" SERIAL,
"company_id" INTEGER NOT NULL,
"name" varchar(255) NOT NULL,
"city_name" INTEGER DEFAULT NULL,
"city_id" INTEGER DEFAULT NULL,
"country_id" INTEGER DEFAULT NULL,
"branch_code" varchar(191) DEFAULT NULL,
"phone" varchar(191) NOT NULL,
"fax" INTEGER DEFAULT NULL,
"bank_id" INTEGER DEFAULT NULL,
"voucher_id" INTEGER DEFAULT NULL,
"cell" varchar(191) NOT NULL,
"address" varchar(191) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"short_name" varchar(255) DEFAULT NULL,
"other_bank" INTEGER DEFAULT NULL,
"cambridge_acc" varchar(191) DEFAULT NULL,
"optional_acc" varchar(191) DEFAULT NULL,
"one_bill_prefix" varchar(20) DEFAULT NULL,
"exam_center_no" varchar(191) DEFAULT NULL,
"provisional_details" varchar(255) NOT NULL,
"tel_no" varchar(255) NOT NULL,
"email" varchar(255) NOT NULL,
"website" varchar(255) NOT NULL,
"main_logo" INTEGER NOT NULL,
"second_logo" INTEGER NOT NULL,
"logo" TEXT DEFAULT NULL,
"ip" varchar(255) DEFAULT NULL,
"port" varchar(255) DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_buildings`
--

DROP TABLE IF EXISTS "erp_buildings" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_buildings" (
"id" SERIAL,
"aggreement_date" date DEFAULT NULL,
"land_name" varchar(191) DEFAULT NULL,
"contact_mail" varchar(191) DEFAULT NULL,
"contact_number" INTEGER DEFAULT NULL,
"cnic" varchar(191) DEFAULT NULL,
"basic_rent" INTEGER DEFAULT NULL,
"security" varchar(191) DEFAULT NULL,
"tenure" varchar(191) DEFAULT NULL,
"increment" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"branch_id" INTEGER NOT NULL,
"agreement_end_date" date NOT NULL,
"profit_amount" varchar(255) DEFAULT '0',
"percentage_value" varchar(255) DEFAULT '0',
"amount" varchar(255) DEFAULT '0',
"registraion_fee_amount" varchar(255) DEFAULT '0',
"registraion_fee_percentage" varchar(255) DEFAULT '0',
"admission_fee_amount" varchar(255) DEFAULT '0',
"admission_fee_percentage" varchar(255) DEFAULT '0',
"tution_fee_percentage" varchar(255) DEFAULT '0',
"tuition_fee_amount" varchar(255) DEFAULT '0',
"lms_fee_amount" varchar(255) DEFAULT '0',
"lms_fee_percentage" varchar(255) DEFAULT '0',
"annual_fee_amount" varchar(255) DEFAULT '0',
"annual_fee_percentage" varchar(255) DEFAULT '0',
"rivy_montessori_bag_fee_amount" varchar(255) DEFAULT '0',
"rivy_montessori_bag_fee_percentage" varchar(255) DEFAULT '0',
"rivy_montessori_prospectus_fee_amount" varchar(255) DEFAULT '0',
"rivy_montessori_prospectus_fee_percentage" varchar(255) DEFAULT '0',
"rivy_id_card_fee_amount" varchar(255) DEFAULT '0',
"rivy_id_card_fee_percentage" varchar(255) DEFAULT '0',
"lab_fee_amount" varchar(255) DEFAULT '0',
"lab_fee_percentage" varchar(255) DEFAULT '0',
"external_sat_fee_amount" varchar(255) DEFAULT '0',
"external_sat_fee_percentage" varchar(255) DEFAULT '0',
"amount_per_student" varchar(255) DEFAULT '0',
"percentage" varchar(255) DEFAULT '0',
"gross_amount" varchar(255) DEFAULT '0'
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_candidate_score`
--

DROP TABLE IF EXISTS "erp_candidate_score" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_candidate_score" (
"id" SERIAL,
"candidate_form_id" INTEGER NOT NULL,
"schedule_id" INTEGER NOT NULL,
"relevant_knowledge" varchar(191) DEFAULT NULL,
"skills" varchar(191) DEFAULT NULL,
"communication" varchar(191) DEFAULT NULL,
"relevant_experience" varchar(191) DEFAULT NULL,
"confidence" varchar(191) DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_category_policies`
--

DROP TABLE IF EXISTS "erp_category_policies" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_category_policies" (
"id" SERIAL,
"categorypolicy_name" varchar(191) DEFAULT NULL,
"categorypolicy_description" varchar(191) DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_child_benefit`
--

DROP TABLE IF EXISTS "erp_child_benefit" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_child_benefit" (
"id" SERIAL,
"student_id" INTEGER NOT NULL,
"teacher_id" INTEGER NOT NULL,
"percentage" varchar(191) DEFAULT NULL,
"status" TEXT NOT NULL DEFAULT 'Active',
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_city`
--

DROP TABLE IF EXISTS "erp_city" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_city" (
"id" SERIAL,
"name" varchar(191) DEFAULT NULL,
"country_id" INTEGER DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_companies`
--

DROP TABLE IF EXISTS "erp_companies" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_companies" (
"id" SERIAL,
"name" varchar(191) NOT NULL,
"description" varchar(191) DEFAULT NULL,
"ntn" varchar(191) DEFAULT NULL,
"gst" varchar(191) DEFAULT NULL,
"gst_type" TEXT DEFAULT NULL,
"vat" varchar(191) DEFAULT NULL,
"phone" varchar(191) DEFAULT NULL,
"fax" varchar(191) DEFAULT NULL,
"address" varchar(191) DEFAULT NULL,
"logo" TEXT DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_country`
--

DROP TABLE IF EXISTS "erp_country" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_country" (
"id" SERIAL,
"name" varchar(191) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_currencies`
--

DROP TABLE IF EXISTS "erp_currencies" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_currencies" (
"id" BIGINT NOT NULL,
"name" varchar(255) NOT NULL,
"code" varchar(10) NOT NULL,
"symbol" varchar(10) NOT NULL,
"rate" decimal(11,2) NOT NULL,
"is_default" SMALLINT NOT NULL DEFAULT 0,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_daily_attendance`
--

DROP TABLE IF EXISTS "erp_daily_attendance" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_daily_attendance" (
"daily_attendance_id" INTEGER NOT NULL,
"user_id" INTEGER NOT NULL,
"date" date NOT NULL,
"time_in" time DEFAULT NULL,
"time_out" time DEFAULT NULL,
"created_at" date NOT NULL,
"updated_at" date NOT NULL,
"branch_id" INTEGER NOT NULL,
"status" varchar(255) NOT NULL,
"remarks" varchar(255) DEFAULT NULL,
"month" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_entries`
--

DROP TABLE IF EXISTS "erp_entries" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_entries" (
"id" SERIAL,
"number" varchar(255) NOT NULL,
"financial_year" INTEGER DEFAULT NULL,
"voucher_date" date NOT NULL,
"instrument_number" varchar(191) DEFAULT NULL,
"instrument_number_2" varchar(191) DEFAULT NULL,
"cheque_no" varchar(191) DEFAULT NULL,
"cheque_date" date DEFAULT NULL,
"invoice_no" varchar(191) DEFAULT NULL,
"invoice_date" date DEFAULT NULL,
"cdr_no" varchar(191) DEFAULT NULL,
"cdr_date" date DEFAULT NULL,
"bdr_no" varchar(191) DEFAULT NULL,
"bdr_date" date DEFAULT NULL,
"bank_name" varchar(255) DEFAULT NULL,
"bank_branch" varchar(255) DEFAULT NULL,
"drawn_date" date DEFAULT NULL,
"dr_total" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
"cr_total" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
"narration" TEXT DEFAULT NULL,
"remarks" TEXT DEFAULT NULL,
"entry_type_id" INTEGER NOT NULL,
"employee_id" INTEGER NOT NULL,
"branch_id" INTEGER NOT NULL,
"department_id" INTEGER DEFAULT NULL,
"company_id" INTEGER DEFAULT NULL,
"stockitems_id" INTEGER DEFAULT NULL,
"suppliers_id" INTEGER DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"student_id" INTEGER DEFAULT 0,
"fee_collection_id" INTEGER DEFAULT 0
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_entry_items`
--

DROP TABLE IF EXISTS "erp_entry_items" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_entry_items" (
"id" SERIAL,
"entry_type_id" INTEGER NOT NULL,
"entry_id" INTEGER NOT NULL,
"ledger_id" INTEGER DEFAULT 0,
"vendor_id" INTEGER DEFAULT NULL,
"parent_id" INTEGER DEFAULT NULL,
"parent_type" varchar(50) DEFAULT NULL,
"voucher_date" date NOT NULL,
"amount" DOUBLE PRECISION NOT NULL,
"dc" TEXT NOT NULL,
"narration" TEXT DEFAULT NULL,
"instrument_number" varchar(191) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_entry_templates`
--

DROP TABLE IF EXISTS "erp_entry_templates" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_entry_templates" (
"id" SERIAL,
"entry_type_id" INTEGER DEFAULT NULL,
"company_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"narration" TEXT DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 0,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_entry_template_details`
--

DROP TABLE IF EXISTS "erp_entry_template_details" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_entry_template_details" (
"id" SERIAL,
"entry_template_id" INTEGER DEFAULT NULL,
"ledger_id" INTEGER DEFAULT NULL,
"narration" TEXT DEFAULT NULL,
"vendor_id" INTEGER DEFAULT NULL,
"instrument_id" varchar(255) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 0,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_entry_types`
--

DROP TABLE IF EXISTS "erp_entry_types" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_entry_types" (
"id" SERIAL,
"name" varchar(255) NOT NULL,
"code" varchar(3) NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_fee_head`
--

DROP TABLE IF EXISTS "erp_fee_head" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_fee_head" (
"id" SERIAL,
"fee_section_id" INTEGER DEFAULT NULL,
"rec_parent_group_id" INTEGER NOT NULL,
"inc_parent_group_id" INTEGER NOT NULL,
"rec_group_id" INTEGER NOT NULL,
"inc_group_id" INTEGER NOT NULL,
"title" varchar(191) NOT NULL,
"group_id" INTEGER DEFAULT NULL,
"description" varchar(191) NOT NULL,
"multiple_options" INTEGER DEFAULT 0,
"status" INTEGER NOT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"company_id" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_financial_years`
--

DROP TABLE IF EXISTS "erp_financial_years" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_financial_years" (
"id" SERIAL,
"name" varchar(255) NOT NULL,
"start_date" date NOT NULL,
"end_date" date NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_financial_year_closing`
--

DROP TABLE IF EXISTS "erp_financial_year_closing" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_financial_year_closing" (
"id" SERIAL,
"company_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"financial_year_id" INTEGER DEFAULT NULL,
"entry_id" INTEGER DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 0,
"created_by" INTEGER NOT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_groups`
--

DROP TABLE IF EXISTS "erp_groups" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_groups" (
"id" SERIAL,
"name" varchar(255) NOT NULL,
"number" varchar(255) DEFAULT NULL,
"code" varchar(255) DEFAULT NULL,
"level" INTEGER NOT NULL DEFAULT 1,
"parent_id" INTEGER NOT NULL DEFAULT 0,
"account_type_id" INTEGER DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"parent_type" varchar(191) DEFAULT NULL,
"company_id" INTEGER DEFAULT 0,
"city_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_holidays`
--

DROP TABLE IF EXISTS "erp_holidays" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_holidays" (
"id" SERIAL,
"holiday_name" varchar(255) NOT NULL,
"start_date" date NOT NULL,
"end_date" date NOT NULL,
"days" INTEGER NOT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ,
"created_by" INTEGER NOT NULL,
"updated_by" INTEGER NOT NULL,
"updated_at" date NOT NULL,
"deleted_by" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_hrm_leaves`
--

DROP TABLE IF EXISTS "erp_hrm_leaves" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_hrm_leaves" (
"id" SERIAL,
"leave_request_id" INTEGER NOT NULL,
"employee_id" INTEGER NOT NULL,
"leave_type_id" INTEGER NOT NULL,
"branch_id" INTEGER NOT NULL,
"leave_status_id" INTEGER NOT NULL,
"leave_date" date NOT NULL,
"start_time" varchar(5) NOT NULL,
"end_time" varchar(5) NOT NULL,
"shift" varchar(10) NOT NULL,
"hours" DOUBLE PRECISION NOT NULL,
"paid" SMALLINT NOT NULL DEFAULT 1,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_hrm_leave_entitlements`
--

DROP TABLE IF EXISTS "erp_hrm_leave_entitlements" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_hrm_leave_entitlements" (
"id" SERIAL,
"employee_id" INTEGER NOT NULL,
"no_of_days" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
"days_used" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
"start_date" date DEFAULT NULL,
"end_date" date DEFAULT NULL,
"credited_date" date DEFAULT NULL,
"leave_type_id" INTEGER NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_hrm_leave_periods`
--

DROP TABLE IF EXISTS "erp_hrm_leave_periods" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_hrm_leave_periods" (
"id" SERIAL,
"start_day" SMALLINT NOT NULL,
"start_month" SMALLINT NOT NULL,
"end_day" SMALLINT NOT NULL,
"end_month" SMALLINT NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_hrm_leave_requests`
--

DROP TABLE IF EXISTS "erp_hrm_leave_requests" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_hrm_leave_requests" (
"id" SERIAL,
"employee_id" INTEGER NOT NULL,
"leave_type_id" INTEGER NOT NULL,
"branch_id" INTEGER NOT NULL,
"leave_status" INTEGER NOT NULL DEFAULT 3,
"start_date" date NOT NULL,
"end_date" date NOT NULL,
"total_days" SMALLINT NOT NULL,
"applied_date" date NOT NULL,
"comments" TEXT DEFAULT NULL,
"remarks" TEXT DEFAULT NULL,
"attachment" TEXT DEFAULT NULL,
"work_shift_data" TEXT DEFAULT NULL,
"single_duration" varchar(20) DEFAULT NULL,
"single_shift" varchar(20) DEFAULT NULL,
"single_hours_start" varchar(5) DEFAULT NULL,
"single_hours_end" varchar(5) DEFAULT NULL,
"single_hours_duration" SMALLINT DEFAULT NULL,
"partial_days" varchar(20) DEFAULT NULL,
"all_days_duration" varchar(20) DEFAULT NULL,
"all_days_shift" varchar(20) DEFAULT NULL,
"all_days_hours_start" varchar(5) DEFAULT NULL,
"all_days_hours_end" varchar(5) DEFAULT NULL,
"all_days_hours_duration" SMALLINT DEFAULT NULL,
"starting_duration" varchar(20) DEFAULT NULL,
"starting_shift" varchar(20) DEFAULT NULL,
"starting_hours_start" varchar(5) DEFAULT NULL,
"starting_hours_end" varchar(5) DEFAULT NULL,
"starting_hours_duration" SMALLINT DEFAULT NULL,
"ending_duration" varchar(20) DEFAULT NULL,
"ending_shift" varchar(20) DEFAULT NULL,
"ending_hours_start" varchar(5) DEFAULT NULL,
"ending_hours_end" varchar(5) DEFAULT NULL,
"ending_hours_duration" SMALLINT DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 0,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_hrm_leave_statuses`
--

DROP TABLE IF EXISTS "erp_hrm_leave_statuses" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_hrm_leave_statuses" (
"id" SERIAL,
"name" varchar(255) NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_hrm_leave_types`
--

DROP TABLE IF EXISTS "erp_hrm_leave_types" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_hrm_leave_types" (
"id" SERIAL,
"name" varchar(255) NOT NULL,
"permitted_days" INTEGER NOT NULL DEFAULT 0,
"year" INTEGER NOT NULL DEFAULT 0,
"parent_id" INTEGER DEFAULT 0,
"type" varchar(20) DEFAULT NULL,
"start_date" date DEFAULT NULL,
"end_date" date DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_hrm_work_shifts`
--

DROP TABLE IF EXISTS "erp_hrm_work_shifts" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_hrm_work_shifts" (
"id" SERIAL,
"name" varchar(255) NOT NULL,
"branch_id" INTEGER DEFAULT NULL,
"grace_in" INTEGER DEFAULT NULL,
"grace_out" INTEGER DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_hrm_work_weeks`
--

DROP TABLE IF EXISTS "erp_hrm_work_weeks" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_hrm_work_weeks" (
"id" SERIAL,
"day" INTEGER NOT NULL,
"on_off" INTEGER DEFAULT NULL,
"work_shift_id" INTEGER NOT NULL,
"start_time" time DEFAULT NULL,
"end_time" time DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_inventorytransfer`
--

DROP TABLE IF EXISTS "erp_inventorytransfer" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_inventorytransfer" (
"id" SERIAL,
"branch_from" INTEGER NOT NULL,
"branch_to" INTEGER NOT NULL,
"sup_id" INTEGER DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_inventorytransferdetail`
--

DROP TABLE IF EXISTS "erp_inventorytransferdetail" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_inventorytransferdetail" (
"id" SERIAL,
"i_transfer_id" INTEGER NOT NULL,
"product_id" INTEGER NOT NULL,
"transfer_qty" INTEGER NOT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_laws`
--

DROP TABLE IF EXISTS "erp_laws" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_laws" (
"law_id" INTEGER NOT NULL,
"law_section" varchar(255) NOT NULL,
"description" varchar(255) NOT NULL,
"group_id" INTEGER NOT NULL,
"created_at" date NOT NULL,
"updated_at" date NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_law_rates`
--

DROP TABLE IF EXISTS "erp_law_rates" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_law_rates" (
"law_rate_id" INTEGER NOT NULL,
"law_id" INTEGER NOT NULL,
"type" varchar(191) NOT NULL,
"percentage" varchar(191) NOT NULL,
"amount_limit" varchar(191) NOT NULL,
"created_at" date NOT NULL,
"updated_at" date NOT NULL,
"status" varchar(255) NOT NULL,
"service_id" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_ledgers`
--

DROP TABLE IF EXISTS "erp_ledgers" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_ledgers" (
"id" SERIAL,
"name" varchar(255) NOT NULL,
"number" varchar(255) DEFAULT NULL,
"code" varchar(255) DEFAULT NULL,
"group_id" INTEGER NOT NULL DEFAULT 0,
"group_number" varchar(255) DEFAULT NULL,
"opening_balance" INTEGER DEFAULT 0,
"closing_balance" INTEGER DEFAULT 0,
"balance_type" TEXT NOT NULL DEFAULT 'c',
"account_type_id" INTEGER DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"branch_id" INTEGER DEFAULT NULL,
"company_id" INTEGER DEFAULT NULL,
"city_id" INTEGER DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"parent_type" varchar(191) DEFAULT NULL,
"is_common" SMALLINT DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_loans`
--

DROP TABLE IF EXISTS "erp_loans" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_loans" (
"loan_id" INTEGER NOT NULL,
"loan_type" varchar(255) NOT NULL,
"description" varchar(255) NOT NULL,
"created_at" date NOT NULL,
"updated_at" date NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_loan_plans`
--

DROP TABLE IF EXISTS "erp_loan_plans" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_loan_plans" (
"loan_plan_id" INTEGER NOT NULL,
"loan_installment" varchar(255) NOT NULL,
"tenure" varchar(255) NOT NULL,
"extra_pay" varchar(255) NOT NULL,
"created_at" date NOT NULL,
"updated_at" date NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_model_has_permissions`
--

DROP TABLE IF EXISTS "erp_model_has_permissions" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_model_has_permissions" (
"permission_id" INTEGER NOT NULL,
"model_id" INTEGER NOT NULL,
"model_type" varchar(191) NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_model_has_roles`
--

DROP TABLE IF EXISTS "erp_model_has_roles" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_model_has_roles" (
"role_id" INTEGER NOT NULL,
"model_id" INTEGER NOT NULL,
"model_type" varchar(191) NOT NULL,
"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_notifications`
--

DROP TABLE IF EXISTS "erp_notifications" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_notifications" (
"notify_id" INTEGER NOT NULL,
"module_type" varchar(255) NOT NULL,
"sender" INTEGER NOT NULL,
"receiver" INTEGER NOT NULL,
"description" varchar(255) NOT NULL,
"status" INTEGER NOT NULL,
"rid" INTEGER NOT NULL,
"created_by" INTEGER NOT NULL,
"modified_by" INTEGER NOT NULL,
"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ,
"created_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_password_resets`
--

DROP TABLE IF EXISTS "erp_password_resets" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_password_resets" (
"email" varchar(191) NOT NULL,
"token" varchar(191) NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_payees_amounts`
--

DROP TABLE IF EXISTS "erp_payees_amounts" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_payees_amounts" (
"id" SERIAL,
"building_id" INTEGER DEFAULT NULL,
"payee_id" INTEGER DEFAULT NULL,
"payee_amount" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_payee_lists`
--

DROP TABLE IF EXISTS "erp_payee_lists" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_payee_lists" (
"id" SERIAL,
"payee_name" varchar(191) DEFAULT NULL,
"vendor_type" varchar(191) DEFAULT NULL,
"branch_id" BIGINT DEFAULT NULL,
"phone" varchar(191) DEFAULT NULL,
"email" varchar(191) DEFAULT NULL,
"address" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"rate_type" varchar(255) DEFAULT NULL,
"amount" INTEGER NOT NULL DEFAULT 0,
"percentage" DOUBLE PRECISION NOT NULL DEFAULT 0.00
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_payment_methods`
--

DROP TABLE IF EXISTS "erp_payment_methods" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_payment_methods" (
"id" SERIAL,
"name" varchar(255) NOT NULL,
"payment_type" SMALLINT NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_payment_sheet`
--

DROP TABLE IF EXISTS "erp_payment_sheet" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_payment_sheet" (
"sheet_id" INTEGER NOT NULL,
"sheet_type" varchar(255) NOT NULL,
"sheet_code" varchar(255) NOT NULL,
"prepared_by" varchar(255) NOT NULL,
"created_at" date NOT NULL,
"updated_at" date NOT NULL,
"company_id" INTEGER NOT NULL,
"city_id" INTEGER NOT NULL,
"branch_id" INTEGER NOT NULL,
"ledger_head_id" INTEGER DEFAULT 0,
"group_id" INTEGER NOT NULL,
"approval_by_dgm" varchar(255) NOT NULL,
"approval_by_gm" varchar(255) NOT NULL,
"approved_by_accountant" varchar(255) NOT NULL,
"sheet_type_name" varchar(255) NOT NULL,
"approval_by_tax" varchar(255) NOT NULL,
"add_salary_bank" varchar(11) NOT NULL DEFAULT 'no',
"month_id" INTEGER DEFAULT 0,
"year_id" INTEGER DEFAULT 0
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_payment_sheet_details`
--

DROP TABLE IF EXISTS "erp_payment_sheet_details" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_payment_sheet_details" (
"ps_id" INTEGER NOT NULL,
"ledger_id" INTEGER DEFAULT NULL,
"vendor_id" INTEGER DEFAULT NULL,
"mode" varchar(191) DEFAULT NULL,
"inv_amount" INTEGER DEFAULT NULL,
"advance" INTEGER DEFAULT NULL,
"tax_rate" INTEGER DEFAULT NULL,
"law_id" INTEGER DEFAULT NULL,
"amount" INTEGER DEFAULT NULL,
"cheque_amount" INTEGER DEFAULT NULL,
"remarks" varchar(255) DEFAULT NULL,
"status" TEXT DEFAULT NULL,
"sheet_id" varchar(255) DEFAULT NULL,
"updated_at" date NOT NULL,
"created_at" date NOT NULL,
"pra" INTEGER DEFAULT NULL,
"entry_type" varchar(255) DEFAULT NULL,
"entry_id" varchar(255) DEFAULT NULL,
"rent_id" INTEGER DEFAULT 0,
"amount_after" varchar(255) DEFAULT NULL,
"amount_before" varchar(255) DEFAULT '0',
"advance_appears" varchar(255) DEFAULT '0',
"file" varchar(191) DEFAULT NULL,
"cheque_no" INTEGER DEFAULT NULL,
"cheque_date" date DEFAULT NULL,
"invoice_no" varchar(191) DEFAULT NULL,
"invoice_date" date DEFAULT NULL,
"employee_id" INTEGER DEFAULT 0,
"bank_id" INTEGER DEFAULT 0,
"employee_loan_id" INTEGER DEFAULT 0,
"assets_id" INTEGER DEFAULT 0,
"expense_types" varchar(255) DEFAULT '0',
"remaining_amount" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_permissions`
--

DROP TABLE IF EXISTS "erp_permissions" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_permissions" (
"id" SERIAL,
"name" varchar(191) NOT NULL,
"guard_name" varchar(191) NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"title" varchar(191) DEFAULT NULL,
"main_group" SMALLINT NOT NULL DEFAULT 0,
"parent_id" SMALLINT NOT NULL DEFAULT 0,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_permission_role`
--

DROP TABLE IF EXISTS "erp_permission_role" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_permission_role" (
"id" BIGINT NOT NULL,
"permission_id" INTEGER NOT NULL,
"role_id" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_policies`
--

DROP TABLE IF EXISTS "erp_policies" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_policies" (
"id" SERIAL,
"category_policy_id" INTEGER NOT NULL,
"policy_name" varchar(191) DEFAULT NULL,
"policy_description" varchar(191) DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_roles`
--

DROP TABLE IF EXISTS "erp_roles" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_roles" (
"id" SERIAL,
"name" varchar(191) NOT NULL,
"display_name" varchar(191) NOT NULL,
"guard_name" varchar(191) NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"staff_type_id" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_role_has_permissions`
--

DROP TABLE IF EXISTS "erp_role_has_permissions" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_role_has_permissions" (
"permission_id" INTEGER NOT NULL,
"role_id" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_settings`
--

DROP TABLE IF EXISTS "erp_settings" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_settings" (
"id" SERIAL,
"name" varchar(255) NOT NULL,
"description" TEXT NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_staff_salaries`
--

DROP TABLE IF EXISTS "erp_staff_salaries" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_staff_salaries" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"sheet_code" varchar(191) NOT NULL,
"name" varchar(100) NOT NULL,
"ledger_id" INTEGER NOT NULL,
"staff_id" INTEGER NOT NULL,
"staff_category" varchar(100) DEFAULT NULL,
"gross_salary" INTEGER NOT NULL DEFAULT 0,
"basic_salary" INTEGER DEFAULT 0,
"medical_allowance" varchar(191) NOT NULL DEFAULT '0',
"house_rent_allowance" varchar(191) NOT NULL DEFAULT '0',
"conveyance_allowance" INTEGER NOT NULL DEFAULT 0,
"training" INTEGER DEFAULT 0,
"eobi_amount" INTEGER DEFAULT 0,
"epf_amount" INTEGER DEFAULT 0,
"tax_amount" INTEGER DEFAULT 0,
"loan_amount" INTEGER DEFAULT 0,
"remaining_amount" INTEGER DEFAULT 0,
"pay_loan" INTEGER DEFAULT 0,
"salary_slip_id" INTEGER DEFAULT 0,
"description" varchar(191) DEFAULT NULL,
"net_salary" INTEGER DEFAULT 0,
"pay_status" TEXT NOT NULL DEFAULT 'Yes',
"other_deduction" INTEGER DEFAULT NULL,
"date" date NOT NULL,
"year_id" INTEGER DEFAULT 0,
"month_id" varchar(191) DEFAULT '0',
"leaves" INTEGER DEFAULT 0,
"leaves_deduction" INTEGER DEFAULT 0,
"gross_before_adj" INTEGER DEFAULT 0,
"total_epf" INTEGER DEFAULT 0,
"total_eobi" INTEGER DEFAULT 0,
"total_tax" INTEGER DEFAULT 0,
"total_salary" INTEGER DEFAULT 0,
"salary_status" TEXT NOT NULL DEFAULT 'Pending',
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"principal_approval_status" varchar(255) DEFAULT 'Pending',
"principal_approved_by" varchar(255) DEFAULT 'Pending',
"accountant_salary_status" varchar(191) NOT NULL DEFAULT 'Pending',
"dgm_salary_status" varchar(191) NOT NULL DEFAULT 'Pending',
"gm_salary_status" varchar(191) NOT NULL DEFAULT 'Pending',
"ceo_salary_status" varchar(191) NOT NULL DEFAULT 'Pending',
"gm_name_salary_approve" varchar(191) NOT NULL DEFAULT 'Pending',
"accountant_name_salary_approve" varchar(191) NOT NULL DEFAULT 'Pending',
"dgm_name_salary_approve" varchar(191) NOT NULL DEFAULT 'Pending',
"ceo_name_salary_approve" varchar(191) NOT NULL DEFAULT 'Pending',
"sequence" INTEGER DEFAULT NULL,
"arrears" INTEGER NOT NULL DEFAULT 0,
"remarks" TEXT DEFAULT NULL,
"bank_account" varchar(255) DEFAULT NULL,
"financial_year" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_tax_settings`
--

DROP TABLE IF EXISTS "erp_tax_settings" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_tax_settings" (
"id" SERIAL,
"tax_type" INTEGER NOT NULL DEFAULT 1,
"fix_amount" DOUBLE PRECISION DEFAULT 0.00,
"tax_percent" DOUBLE PRECISION DEFAULT 0.00,
"start_range" DOUBLE PRECISION DEFAULT 0.00,
"end_range" DOUBLE PRECISION DEFAULT 0.00,
"year" INTEGER DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"law_id" INTEGER NOT NULL,
"tax_class" varchar(255) NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_users`
--

DROP TABLE IF EXISTS "erp_users" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_users" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"role_id" INTEGER DEFAULT NULL,
"hook_id" INTEGER DEFAULT NULL,
"employee_id" INTEGER DEFAULT NULL,
"name" varchar(191) NOT NULL,
"email" varchar(191) NOT NULL,
"password" varchar(191) NOT NULL,
"api_token" varchar(255) DEFAULT NULL,
"user_type" TEXT DEFAULT NULL,
"remember_token" varchar(191) DEFAULT NULL,
"last_login_at" varchar(191) DEFAULT NULL,
"last_login_ip" varchar(191) DEFAULT NULL,
"lockout_time" varchar(191) DEFAULT NULL,
"active" SMALLINT NOT NULL DEFAULT 0,
"reason" varchar(1000) DEFAULT NULL,
"status" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"string_password" varchar(191) DEFAULT NULL,
"board_id_one" INTEGER NOT NULL DEFAULT 0,
"board_id_two" INTEGER NOT NULL DEFAULT 0,
"program_id_one" INTEGER NOT NULL DEFAULT 0,
"program_id_two" INTEGER NOT NULL DEFAULT 0
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_vendor`
--

DROP TABLE IF EXISTS "erp_vendor" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_vendor" (
"vendor_id" INTEGER NOT NULL,
"vendor_name" varchar(191) DEFAULT NULL,
"cnic" varchar(191) DEFAULT NULL,
"ntn" varchar(191) DEFAULT NULL,
"salestaxno" varchar(191) DEFAULT NULL,
"email" varchar(191) DEFAULT NULL,
"contact" varchar(191) DEFAULT NULL,
"addresss" varchar(191) DEFAULT NULL,
"created_at" date NOT NULL,
"updated_at" date NOT NULL,
"updated_by" varchar(255) NOT NULL,
"type" varchar(255) DEFAULT NULL,
"category" varchar(255) DEFAULT NULL,
"service_type" varchar(255) DEFAULT NULL,
"remarks" varchar(191) DEFAULT NULL,
"acc_no" varchar(191) DEFAULT NULL,
"pra_no" varchar(191) DEFAULT NULL,
"pra_type" varchar(255) DEFAULT NULL,
"sales_tax" varchar(255) DEFAULT NULL,
"bank_branch_code" varchar(255) DEFAULT NULL,
"bank_branch_name" varchar(255) DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `erp_workdays`
--

DROP TABLE IF EXISTS "erp_workdays" CASCADE;
CREATE TABLE IF NOT EXISTS "erp_workdays" (
"id" SERIAL,
"title" varchar(255) NOT NULL,
"date" date NOT NULL,
"workday_length" SMALLINT NOT NULL,
"applicable_to" INTEGER NOT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `event_case_log`
--

DROP TABLE IF EXISTS "event_case_log" CASCADE;
CREATE TABLE IF NOT EXISTS "event_case_log" (
"id" SERIAL,
"table_id" INTEGER DEFAULT 0,
"table_name" TEXT NOT NULL,
"event_trigger" TEXT NOT NULL,
"event_description" TEXT NOT NULL,
"username" TEXT NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"user_id" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `event_images`
--

DROP TABLE IF EXISTS "event_images" CASCADE;
CREATE TABLE IF NOT EXISTS "event_images" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"group_event_id" INTEGER DEFAULT NULL,
"type" INTEGER NOT NULL DEFAULT 1,
"images" varchar(191) DEFAULT NULL,
"files" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `event_models`
--

DROP TABLE IF EXISTS "event_models" CASCADE;
CREATE TABLE IF NOT EXISTS "event_models" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"title" varchar(191) NOT NULL,
"start" varchar(191) NOT NULL,
"end" varchar(191) NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `event_time_tables`
--

DROP TABLE IF EXISTS "event_time_tables" CASCADE;
CREATE TABLE IF NOT EXISTS "event_time_tables" (
"id" SERIAL,
"time_table_id" INTEGER NOT NULL,
"event_id" INTEGER NOT NULL,
"date" varchar(191) NOT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `examguide`
--

DROP TABLE IF EXISTS "examguide" CASCADE;
CREATE TABLE IF NOT EXISTS "examguide" (
"id" SERIAL,
"session_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"subject_id" INTEGER DEFAULT NULL,
"program" INTEGER DEFAULT NULL,
"title" varchar(250) DEFAULT NULL,
"year" varchar(191) DEFAULT NULL,
"description" varchar(250) DEFAULT NULL,
"file" varchar(191) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `exams`
--

DROP TABLE IF EXISTS "exams" CASCADE;
CREATE TABLE IF NOT EXISTS "exams" (
"id" SERIAL,
"title" varchar(191) DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"status" INTEGER DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `exam_center_draft_amount`
--

DROP TABLE IF EXISTS "exam_center_draft_amount" CASCADE;
CREATE TABLE IF NOT EXISTS "exam_center_draft_amount" (
"id" SERIAL,
"exam_center_no" varchar(191) NOT NULL,
"session" varchar(191) NOT NULL,
"subject_type" INTEGER NOT NULL,
"draft_amount" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `exam_mark_ledgers`
--

DROP TABLE IF EXISTS "exam_mark_ledgers" CASCADE;
CREATE TABLE IF NOT EXISTS "exam_mark_ledgers" (
"id" SERIAL,
"active_session_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"exam_schedule_id" INTEGER DEFAULT NULL,
"students_id" INTEGER DEFAULT NULL,
"obtain_mark_theory" INTEGER DEFAULT NULL,
"absent_theory" INTEGER DEFAULT NULL,
"obtain_mark_practical" INTEGER DEFAULT NULL,
"absent_practical" INTEGER DEFAULT NULL,
"approve_status" INTEGER DEFAULT NULL,
"sorting_order" INTEGER DEFAULT NULL,
"status" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `exam_schedules`
--

DROP TABLE IF EXISTS "exam_schedules" CASCADE;
CREATE TABLE IF NOT EXISTS "exam_schedules" (
"id" SERIAL,
"term_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"exam_id" INTEGER DEFAULT NULL,
"grading_types_id" INTEGER DEFAULT NULL,
"subjects_id" INTEGER DEFAULT NULL,
"years_id" INTEGER DEFAULT NULL,
"months_id" INTEGER DEFAULT NULL,
"semesters_id" INTEGER DEFAULT NULL,
"exams_id" INTEGER DEFAULT NULL,
"assessment_id" INTEGER DEFAULT NULL,
"submission" INTEGER DEFAULT NULL,
"faculty_id" INTEGER DEFAULT NULL,
"section_id" INTEGER DEFAULT NULL,
"passing_marks" INTEGER DEFAULT NULL,
"datesheet_id" INTEGER DEFAULT NULL,
"teacher_id" INTEGER DEFAULT NULL,
"active_session_id" INTEGER DEFAULT NULL,
"active_session_section_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"class_id" INTEGER DEFAULT NULL,
"conducted" TEXT NOT NULL,
"start_date" date DEFAULT NULL,
"end_date" date DEFAULT NULL,
"start_time" time DEFAULT NULL,
"end_time" time DEFAULT NULL,
"total_marks" DOUBLE PRECISION DEFAULT NULL,
"approval_status" INTEGER DEFAULT 1,
"publish_status" INTEGER DEFAULT 1,
"status" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `exam_schedule_details`
--

DROP TABLE IF EXISTS "exam_schedule_details" CASCADE;
CREATE TABLE IF NOT EXISTS "exam_schedule_details" (
"id" SERIAL,
"exam_schedule_id" INTEGER DEFAULT NULL,
"title" varchar(191) DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"file" varchar(191) DEFAULT NULL,
"status" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `exam_time_tables`
--

DROP TABLE IF EXISTS "exam_time_tables" CASCADE;
CREATE TABLE IF NOT EXISTS "exam_time_tables" (
"id" SERIAL,
"time_table_id" INTEGER DEFAULT NULL,
"exam_id" INTEGER DEFAULT NULL,
"date" date DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `faculties`
--

DROP TABLE IF EXISTS "faculties" CASCADE;
CREATE TABLE IF NOT EXISTS "faculties" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"session_id" INTEGER NOT NULL,
"program" INTEGER NOT NULL,
"faculty" varchar(191) DEFAULT NULL,
"slug" varchar(191) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `faculty_semesters`
--

DROP TABLE IF EXISTS "faculty_semesters" CASCADE;
CREATE TABLE IF NOT EXISTS "faculty_semesters" (
"id" SERIAL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"program_id" INTEGER NOT NULL,
"term_id" INTEGER NOT NULL,
"branch_id" INTEGER NOT NULL,
"session_id" INTEGER NOT NULL,
"class_teacher" INTEGER NOT NULL,
"faculty_id" INTEGER NOT NULL,
"section_name" varchar(191) DEFAULT NULL,
"student_strength" INTEGER DEFAULT NULL,
"limit_counter" TEXT DEFAULT NULL,
"slug" TEXT DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `faculty_semester_timetables`
--

DROP TABLE IF EXISTS "faculty_semester_timetables" CASCADE;
CREATE TABLE IF NOT EXISTS "faculty_semester_timetables" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"faculty_semester_id" INTEGER DEFAULT NULL,
"subject_id" INTEGER DEFAULT NULL,
"title" varchar(250) DEFAULT NULL,
"start" TIMESTAMP DEFAULT NULL,
"end" TIMESTAMP DEFAULT NULL,
"start_time" time DEFAULT NULL,
"end_time" time DEFAULT NULL,
"room" varchar(250) DEFAULT NULL,
"color" varchar(20) DEFAULT NULL,
"description" varchar(250) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `faculty_subjects`
--

DROP TABLE IF EXISTS "faculty_subjects" CASCADE;
CREATE TABLE IF NOT EXISTS "faculty_subjects" (
"id" SERIAL,
"facultysemester_id" INTEGER DEFAULT NULL,
"faculty_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"term_id" INTEGER DEFAULT NULL,
"subjects" INTEGER DEFAULT NULL,
"staff_id" INTEGER DEFAULT NULL,
"section_id" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_accounts_relationship`
--

DROP TABLE IF EXISTS "fee_accounts_relationship" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_accounts_relationship" (
"id" SERIAL,
"month" INTEGER NOT NULL,
"year_id" INTEGER NOT NULL,
"admission_fee" varchar(255) NOT NULL,
"registration_fee" varchar(255) NOT NULL,
"annual_fee" varchar(255) NOT NULL,
"id_card_fee" varchar(255) NOT NULL,
"tuition_fee" varchar(255) NOT NULL,
"computer_fee" varchar(255) NOT NULL,
"lab_fee" varchar(255) NOT NULL,
"safety_fee" varchar(255) NOT NULL,
"security_fee" varchar(255) NOT NULL,
"library_fee" varchar(255) NOT NULL,
"lib_fee" varchar(255) NOT NULL,
"party_fund" varchar(255) NOT NULL,
"ib_fee" varchar(255) NOT NULL,
"lms_fee" varchar(255) NOT NULL,
"tax" varchar(255) NOT NULL,
"previous_session_default" varchar(255) NOT NULL,
"total" varchar(255) NOT NULL,
"prepared_by" varchar(255) NOT NULL,
"checked_by" varchar(255) NOT NULL,
"approved_by" varchar(255) NOT NULL,
"entry_id" INTEGER NOT NULL,
"bank_ledger_id" INTEGER NOT NULL,
"branch_id" INTEGER NOT NULL,
"fine" INTEGER NOT NULL,
"created_by" INTEGER NOT NULL,
"updated_by" INTEGER NOT NULL,
"created_at" date NOT NULL,
"updated_at" date NOT NULL,
"reason" TEXT DEFAULT NULL,
"rejection_status" INTEGER NOT NULL DEFAULT 0
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_automate`
--

DROP TABLE IF EXISTS "fee_automate" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_automate" (
"fa_id" INTEGER NOT NULL,
"student_id" varchar(255) DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"class_id" INTEGER DEFAULT NULL,
"intake_id" INTEGER DEFAULT NULL,
"total_fee" varchar(255) DEFAULT NULL,
"tuition_fee" varchar(255) DEFAULT NULL,
"annual_fee" varchar(255) DEFAULT NULL,
"safety_fee" varchar(255) DEFAULT NULL,
"id_card" varchar(255) DEFAULT NULL,
"computer_fee" INTEGER NOT NULL,
"lms_fee" varchar(255) DEFAULT NULL,
"ib_fee" INTEGER NOT NULL,
"party_fee" INTEGER DEFAULT NULL,
"no_of_installments" INTEGER DEFAULT NULL,
"per_month_fee" varchar(11) NOT NULL,
"status" INTEGER DEFAULT 0,
"fee_structure_code" varchar(255) DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_bill_edit_history`
--

DROP TABLE IF EXISTS "fee_bill_edit_history" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_bill_edit_history" (
"id" SERIAL,
"bill_no" varchar(255) NOT NULL,
"from_amount" varchar(255) NOT NULL,
"to_amount" varchar(255) NOT NULL,
"updated_by" INTEGER NOT NULL,
"created_by" INTEGER NOT NULL,
"created_at" date NOT NULL,
"updated_at" date NOT NULL,
"remarks" TEXT NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_collections`
--

DROP TABLE IF EXISTS "fee_collections" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_collections" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"session_id" INTEGER DEFAULT NULL,
"students_id" INTEGER NOT NULL,
"fee_masters_id" INTEGER NOT NULL,
"fee_structure_code" INTEGER NOT NULL,
"bill_no" varchar(255) DEFAULT NULL,
"fee_term_id" varchar(255) NOT NULL,
"due_date" date DEFAULT NULL,
"paid_date" varchar(255) DEFAULT NULL,
"paid_amount" DOUBLE PRECISION DEFAULT 0.00,
"post_date" date DEFAULT NULL,
"discount" DOUBLE PRECISION DEFAULT 0.00,
"discount_type" DOUBLE PRECISION DEFAULT 1.00,
"fine" DOUBLE PRECISION DEFAULT 0.00,
"tax_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
"total_amount" INTEGER DEFAULT 0,
"payment_mode" varchar(255) DEFAULT NULL,
"note" varchar(100) DEFAULT NULL,
"fee_status" SMALLINT NOT NULL DEFAULT 1,
"fc_id" INTEGER DEFAULT NULL,
"fc_bill_no" varchar(255) DEFAULT NULL,
"balance" DOUBLE PRECISION DEFAULT 0.00,
"all_paid" INTEGER DEFAULT 0,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"voucher_sequence" varchar(255) NOT NULL,
"validity_date" date DEFAULT NULL,
"tax_deduction" INTEGER NOT NULL,
"arreas_amount" varchar(255) DEFAULT '0',
"previous_session_default_amount" INTEGER DEFAULT 0,
"waive_of_fee_discount_amount" INTEGER DEFAULT NULL,
"approved_by_ceo" varchar(191) NOT NULL DEFAULT 'Pending',
"approved_by_gm_finance" varchar(191) NOT NULL DEFAULT 'Pending',
"cancel_fee_amount" INTEGER NOT NULL DEFAULT 0,
"cancel_fee_date" date DEFAULT NULL,
"intake_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"class_id" INTEGER NOT NULL,
"program_id" INTEGER NOT NULL,
"other_tax" INTEGER NOT NULL,
"overall_remarks" varchar(191) DEFAULT NULL,
"active_status" INTEGER DEFAULT 1,
"cancel_voucher" varchar(191) DEFAULT 'No',
"cancel_voucher_remarks" varchar(191) DEFAULT NULL,
"bank_ledger_id" INTEGER DEFAULT NULL,
"starting_date" date DEFAULT NULL,
"ending_date" date DEFAULT '2021-11-30',
"shift_term_id" INTEGER DEFAULT 0,
"voucher_type" TEXT NOT NULL DEFAULT 'Regular',
"tax_amount" INTEGER NOT NULL,
"account_entry_status" INTEGER DEFAULT 0,
"default_bill" INTEGER DEFAULT NULL,
"sheet_id" INTEGER DEFAULT NULL,
"cpr_no" TEXT DEFAULT NULL,
"cpr_date" date DEFAULT NULL,
"registration_fee" INTEGER DEFAULT 0,
"admission_fee" INTEGER DEFAULT 0,
"annual_fee" INTEGER DEFAULT 0,
"id_card_fee" INTEGER DEFAULT 0,
"tuition_fee" INTEGER DEFAULT 0,
"computer_fee" INTEGER DEFAULT 0,
"lab_fee" INTEGER DEFAULT 0,
"safety_fee" INTEGER DEFAULT 0,
"security_fee" INTEGER DEFAULT 0,
"library_fee" INTEGER DEFAULT 0,
"lib_fee" INTEGER DEFAULT 0,
"party_fund" INTEGER DEFAULT 0,
"ib_fee" INTEGER DEFAULT 0,
"lms_fee" INTEGER DEFAULT 0,
"other_fee" INTEGER DEFAULT 0,
"application_fee" INTEGER DEFAULT 0,
"external_fee" INTEGER DEFAULT 0,
"registration_fee_arreas" INTEGER DEFAULT 0,
"admission_fee_arreas" INTEGER DEFAULT 0,
"annual_fee_arreas" INTEGER DEFAULT 0,
"id_card_fee_arreas" INTEGER DEFAULT 0,
"tuition_fee_arreas" INTEGER DEFAULT 0,
"computer_fee_arreas" INTEGER DEFAULT 0,
"lab_fee_arreas" INTEGER DEFAULT 0,
"safety_fee_arreas" INTEGER DEFAULT 0,
"security_fee_arreas" INTEGER DEFAULT 0,
"library_fee_arreas" INTEGER DEFAULT 0,
"lib_fee_arreas" INTEGER DEFAULT 0,
"party_fund_arreas" INTEGER DEFAULT 0,
"ib_fee_arreas" INTEGER DEFAULT 0,
"lms_fee_arreas" INTEGER DEFAULT 0,
"other_fee_arreas" INTEGER DEFAULT 0,
"application_fee_arreas" INTEGER DEFAULT 0,
"external_fee_arreas" INTEGER DEFAULT 0,
"installment_allow" INTEGER DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_collection_detail`
--

DROP TABLE IF EXISTS "fee_collection_detail" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_collection_detail" (
"id" SERIAL,
"fc_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"board_id" INTEGER NOT NULL,
"program_id" INTEGER NOT NULL,
"student_id" INTEGER NOT NULL,
"class_id" INTEGER NOT NULL,
"intake_id" INTEGER NOT NULL,
"session_id" INTEGER NOT NULL,
"bill_id" INTEGER DEFAULT NULL,
"fee_head_id" INTEGER DEFAULT NULL,
"fee_term_id" INTEGER DEFAULT NULL,
"amount" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
"remarks" TEXT NOT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ,
"updated_at" INTEGER DEFAULT NULL,
"arreas" INTEGER DEFAULT 0,
"edit_fee_term" varchar(191) DEFAULT NULL,
"erp_fee_head_id_direct" INTEGER DEFAULT 0
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_heads`
--

DROP TABLE IF EXISTS "fee_heads" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_heads" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"fee_section_id" INTEGER DEFAULT NULL,
"erp_fees_head_id" INTEGER DEFAULT NULL,
"fee_head_desc" varchar(250) DEFAULT NULL,
"dividable" INTEGER DEFAULT NULL,
"fee_head_title" varchar(100) DEFAULT NULL,
"slug" varchar(100) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"rec_group_id" varchar(255) NOT NULL,
"erp_branch_id" INTEGER NOT NULL,
"class_id" INTEGER NOT NULL,
"intake_id" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_history_record`
--

DROP TABLE IF EXISTS "fee_history_record" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_history_record" (
"id" SERIAL,
"student_id" INTEGER NOT NULL,
"class_id" INTEGER NOT NULL,
"session_id" INTEGER NOT NULL,
"total_fee" varchar(255) NOT NULL,
"tuition_fee" varchar(255) NOT NULL,
"created_at" TIMESTAMP NOT NULL,
"updated_at" TIMESTAMP NOT NULL,
"reg_date" date NOT NULL,
"per_month" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_masters`
--

DROP TABLE IF EXISTS "fee_masters" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_masters" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"session_id" INTEGER DEFAULT NULL,
"program_id" INTEGER NOT NULL,
"students_id" INTEGER NOT NULL,
"fee_head" varchar(100) NOT NULL,
"fee_structure_code" INTEGER NOT NULL,
"fee_head_term" INTEGER DEFAULT 1,
"fee_amount" INTEGER DEFAULT NULL,
"fee_discount_percentage" DOUBLE PRECISION DEFAULT NULL,
"fee_discount_comment" varchar(250) DEFAULT NULL,
"scholarship" INTEGER NOT NULL DEFAULT 0,
"scholarship_no_of_a" INTEGER NOT NULL DEFAULT 0,
"discount_type" DOUBLE PRECISION NOT NULL DEFAULT 1.00,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"fee_master_basic_id" varchar(191) DEFAULT NULL,
"erp_entry_items_dr" varchar(191) DEFAULT '0',
"erp_entry_items_cr" varchar(191) DEFAULT '0',
"erp_entry_id" varchar(191) DEFAULT '0',
"class_id" INTEGER NOT NULL,
"fee_master_basic_id_fk" INTEGER NOT NULL,
"fee_paid_amount" INTEGER DEFAULT NULL,
"voucher_term_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"intake_id" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_master_basics`
--

DROP TABLE IF EXISTS "fee_master_basics" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_master_basics" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"student_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"installment_id" INTEGER DEFAULT NULL,
"fee_structure_code" INTEGER NOT NULL,
"fee_type" INTEGER DEFAULT NULL,
"bill_no" varchar(191) DEFAULT NULL,
"basic_fee" varchar(191) DEFAULT NULL,
"total_fee" varchar(191) DEFAULT NULL,
"session_total" INTEGER DEFAULT NULL,
"term_total" INTEGER DEFAULT NULL,
"discount_fee" varchar(191) DEFAULT NULL,
"total_after_discount" varchar(191) DEFAULT NULL,
"discount_type" INTEGER NOT NULL DEFAULT 1,
"special_discount_comment" varchar(191) DEFAULT NULL,
"other_discount_fee" varchar(191) DEFAULT NULL,
"scholarship" INTEGER DEFAULT NULL,
"scholarship_no_of_a" INTEGER DEFAULT NULL,
"voucher_date" date DEFAULT NULL,
"fee_due_date_start" date DEFAULT NULL,
"fee_due_date_end" date DEFAULT NULL,
"status" varchar(191) DEFAULT NULL,
"ceo_approval" INTEGER DEFAULT NULL,
"other_discount_type" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"fee_master_basic_id" varchar(191) DEFAULT NULL,
"class_id" INTEGER NOT NULL,
"intake_id" INTEGER NOT NULL,
"board_id" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_reconcilation_record`
--

DROP TABLE IF EXISTS "fee_reconcilation_record" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_reconcilation_record" (
"id" SERIAL,
"company_id" INTEGER NOT NULL,
"city_id" INTEGER DEFAULT NULL,
"to_date" date DEFAULT NULL,
"from_date" date DEFAULT NULL,
"sheet_code" INTEGER NOT NULL,
"psid" varchar(191) DEFAULT NULL,
"type" varchar(255) NOT NULL,
"approved_by_fee_gm" varchar(255) NOT NULL,
"approved_by_fee_tax_manager" varchar(255) NOT NULL,
"approved_by_tax_manager" varchar(255) NOT NULL,
"approved_by_gm_accounts" varchar(255) NOT NULL,
"status" INTEGER NOT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_refunds`
--

DROP TABLE IF EXISTS "fee_refunds" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_refunds" (
"id" SERIAL,
"fee_head_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"student_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"guardian_refund_relationship" varchar(191) DEFAULT NULL,
"return_amount" INTEGER DEFAULT NULL,
"requesting_date" date DEFAULT NULL,
"approval_date" date DEFAULT NULL,
"approved_by_ceo" varchar(191) NOT NULL DEFAULT 'Pending',
"approved_by_fee_manager" varchar(191) NOT NULL DEFAULT 'Pending',
"refund_status" varchar(191) NOT NULL DEFAULT 'Pending',
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"class_id" INTEGER DEFAULT NULL,
"view_sos_status" INTEGER NOT NULL DEFAULT 0
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_scholarship_defination`
--

DROP TABLE IF EXISTS "fee_scholarship_defination" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_scholarship_defination" (
"id" SERIAL,
"session_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER NOT NULL,
"board_id" INTEGER DEFAULT NULL,
"program_id" INTEGER NOT NULL,
"class_id" INTEGER DEFAULT NULL,
"title" varchar(200) NOT NULL,
"no_of_a" INTEGER NOT NULL,
"term_percentage" REAL DEFAULT 0,
"status" INTEGER NOT NULL DEFAULT 1,
"created_by" INTEGER NOT NULL DEFAULT 0,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_scholarship_definations`
--

DROP TABLE IF EXISTS "fee_scholarship_definations" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_scholarship_definations" (
"id" SERIAL,
"session_id" INTEGER NOT NULL,
"branch_id" INTEGER NOT NULL,
"program_id" INTEGER NOT NULL,
"title" varchar(191) NOT NULL,
"no_of_a" INTEGER NOT NULL,
"term_percentage" TEXT NOT NULL DEFAULT '0',
"status" TEXT NOT NULL DEFAULT '1',
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_scholarship_details`
--

DROP TABLE IF EXISTS "fee_scholarship_details" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_scholarship_details" (
"id" SERIAL,
"fsd_id" INTEGER NOT NULL,
"fee_head_id" INTEGER NOT NULL,
"discount_percentage" DOUBLE PRECISION NOT NULL,
"status" TEXT NOT NULL DEFAULT '1',
"created_by" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_sections`
--

DROP TABLE IF EXISTS "fee_sections" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_sections" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"session_id" INTEGER NOT NULL,
"title" varchar(100) NOT NULL,
"slug" varchar(100) NOT NULL,
"type" INTEGER NOT NULL DEFAULT 1,
"status" varchar(191) DEFAULT '1',
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"fee_section_print_id" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_structures`
--

DROP TABLE IF EXISTS "fee_structures" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_structures" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"branch_id" INTEGER NOT NULL,
"session_id" INTEGER DEFAULT NULL,
"program_id" INTEGER NOT NULL,
"term_id" INTEGER DEFAULT NULL,
"fee_structure_code" varchar(191) DEFAULT NULL,
"fee_head_id" INTEGER NOT NULL,
"fee_amount" DOUBLE PRECISION DEFAULT 0.00,
"status" SMALLINT NOT NULL DEFAULT 1,
"last_updated_by" INTEGER DEFAULT NULL,
"class_id" INTEGER NOT NULL,
"board_id" INTEGER DEFAULT NULL,
"intake_id" INTEGER DEFAULT NULL,
"annual_minimum" INTEGER DEFAULT 0,
"monthly_minimum" INTEGER DEFAULT 0,
"description" TEXT DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_terms`
--

DROP TABLE IF EXISTS "fee_terms" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_terms" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"session_id" INTEGER DEFAULT NULL,
"program_id" INTEGER NOT NULL,
"term_number" INTEGER NOT NULL,
"term_title" varchar(100) NOT NULL,
"term_date" date DEFAULT NULL,
"status" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"board_id" INTEGER NOT NULL,
"class_id" INTEGER NOT NULL,
"group_id" INTEGER NOT NULL,
"starting_date" date NOT NULL,
"ending_date" date NOT NULL,
"intake_id" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_voucher_history`
--

DROP TABLE IF EXISTS "fee_voucher_history" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_voucher_history" (
"id" SERIAL,
"session_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"students_id" INTEGER DEFAULT NULL,
"fee_masters_id" INTEGER DEFAULT NULL,
"fee_structure_code" INTEGER DEFAULT NULL,
"bill_no" INTEGER DEFAULT NULL,
"fee_term_id" INTEGER DEFAULT NULL,
"due_date" date DEFAULT NULL,
"discount_type" INTEGER DEFAULT NULL,
"total_amount" INTEGER DEFAULT NULL,
"fee_status" SMALLINT DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP DEFAULT NULL,
"voucher_sequence" INTEGER DEFAULT NULL,
"validity_date" date DEFAULT NULL,
"intake_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"class_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"overall_remarks" varchar(255) DEFAULT NULL,
"active_status" SMALLINT DEFAULT NULL,
"cancel_voucher" varchar(50) NOT NULL,
"starting_date" date DEFAULT NULL,
"ending_date" date DEFAULT NULL,
"voucher_type" varchar(50) DEFAULT NULL,
"installment_allow" SMALLINT DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `fee_voucher_history_details`
--

DROP TABLE IF EXISTS "fee_voucher_history_details" CASCADE;
CREATE TABLE IF NOT EXISTS "fee_voucher_history_details" (
"id" SERIAL,
"fc_id" INTEGER DEFAULT NULL,
"fee_head_id" INTEGER DEFAULT NULL,
"fee_term_id" INTEGER DEFAULT NULL,
"amount" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP DEFAULT NULL,
"arreas" INTEGER DEFAULT NULL,
"erp_fee_head_id_direct" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `general_settings`
--

DROP TABLE IF EXISTS "general_settings" CASCADE;
CREATE TABLE IF NOT EXISTS "general_settings" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"institute" varchar(100) NOT NULL,
"salogan" varchar(100) DEFAULT NULL,
"address" TEXT NOT NULL,
"phone" varchar(100) DEFAULT NULL,
"email" varchar(100) DEFAULT NULL,
"website" varchar(100) DEFAULT NULL,
"favicon" TEXT DEFAULT NULL,
"logo" TEXT DEFAULT NULL,
"print_header" TEXT DEFAULT NULL,
"print_footer" TEXT DEFAULT NULL,
"facebook" varchar(100) DEFAULT NULL,
"twitter" varchar(100) DEFAULT NULL,
"linkedIn" varchar(100) DEFAULT NULL,
"youtube" varchar(100) DEFAULT NULL,
"googlePlus" varchar(100) DEFAULT NULL,
"instagram" varchar(100) DEFAULT NULL,
"whatsApp" varchar(100) DEFAULT NULL,
"skype" varchar(100) DEFAULT NULL,
"pinterest" varchar(100) DEFAULT NULL,
"wordpress" varchar(100) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `goods_requested_process`
--

DROP TABLE IF EXISTS "goods_requested_process" CASCADE;
CREATE TABLE IF NOT EXISTS "goods_requested_process" (
"id" SERIAL,
"requested_branch_id" INTEGER NOT NULL,
"product_id" INTEGER NOT NULL,
"qty_asked" INTEGER NOT NULL,
"qty_assigned" INTEGER DEFAULT NULL,
"goods_transfer_branch_from_id" INTEGER DEFAULT NULL,
"assigned_request_for_goods" INTEGER NOT NULL DEFAULT 0,
"requested_branch_reason" varchar(191) DEFAULT NULL,
"issue_reported_from_requested_branch" varchar(191) DEFAULT NULL,
"status" varchar(191) NOT NULL DEFAULT 'Pending',
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `grading_scales`
--

DROP TABLE IF EXISTS "grading_scales" CASCADE;
CREATE TABLE IF NOT EXISTS "grading_scales" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"gradingType_id" INTEGER NOT NULL,
"branch_id" INTEGER DEFAULT NULL,
"name" varchar(2) NOT NULL,
"percentage_from" INTEGER NOT NULL,
"percentage_to" INTEGER NOT NULL,
"grade_point" INTEGER DEFAULT NULL,
"description" varchar(100) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `grading_types`
--

DROP TABLE IF EXISTS "grading_types" CASCADE;
CREATE TABLE IF NOT EXISTS "grading_types" (
"id" SERIAL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"title" varchar(50) NOT NULL,
"slug" varchar(50) NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS "groups" CASCADE;
CREATE TABLE IF NOT EXISTS "groups" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"category_id" INTEGER DEFAULT NULL,
"student_id" INTEGER DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `group_categories`
--

DROP TABLE IF EXISTS "group_categories" CASCADE;
CREATE TABLE IF NOT EXISTS "group_categories" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"title" varchar(100) DEFAULT NULL,
"slug" varchar(100) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `group_comments`
--

DROP TABLE IF EXISTS "group_comments" CASCADE;
CREATE TABLE IF NOT EXISTS "group_comments" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"group_id" INTEGER DEFAULT NULL,
"comments" varchar(250) DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `group_events`
--

DROP TABLE IF EXISTS "group_events" CASCADE;
CREATE TABLE IF NOT EXISTS "group_events" (
"id" SERIAL,
"category" varchar(191) NOT NULL,
"category_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"title" INTEGER DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"type" varchar(191) DEFAULT NULL,
"archive" SMALLINT NOT NULL DEFAULT 0,
"video" varchar(191) DEFAULT NULL,
"date" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `group_event_students`
--

DROP TABLE IF EXISTS "group_event_students" CASCADE;
CREATE TABLE IF NOT EXISTS "group_event_students" (
"id" SERIAL,
"group_event_id" INTEGER NOT NULL,
"student_id" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `guardian_details`
--

DROP TABLE IF EXISTS "guardian_details" CASCADE;
CREATE TABLE IF NOT EXISTS "guardian_details" (
"id" SERIAL,
"user_id" INTEGER DEFAULT 0,
"student_id" INTEGER DEFAULT 0,
"guardian_first_name" varchar(191) DEFAULT NULL,
"guardian_middle_name" varchar(191) DEFAULT NULL,
"guardian_last_name" varchar(191) DEFAULT NULL,
"guardian_eligibility" varchar(191) DEFAULT NULL,
"guardian_office" varchar(191) DEFAULT NULL,
"guardian_office_number" varchar(191) DEFAULT NULL,
"guardian_residence_number" varchar(191) DEFAULT NULL,
"guardian_mobile_1" varchar(191) DEFAULT NULL,
"guardian_mobile_2" varchar(191) DEFAULT NULL,
"guardian_address" varchar(191) DEFAULT NULL,
"guardian_image" varchar(191) DEFAULT NULL,
"filer" varchar(191) DEFAULT '0',
"first_name" varchar(191) DEFAULT NULL,
"middle_name" varchar(191) DEFAULT NULL,
"last_name" varchar(191) DEFAULT NULL,
"cnic" varchar(191) DEFAULT NULL,
"guardian_relation" varchar(191) DEFAULT NULL,
"guardian_email" varchar(191) DEFAULT NULL,
"guardian_occupation" varchar(191) DEFAULT NULL,
"address" varchar(191) DEFAULT NULL,
"contact_no" varchar(191) DEFAULT NULL,
"nationality" varchar(191) DEFAULT NULL,
"tax_info" TEXT DEFAULT NULL,
"passport" varchar(191) DEFAULT NULL,
"status" INTEGER DEFAULT 1,
"is_guardian" SMALLINT DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `hrm_work_weeks`
--

DROP TABLE IF EXISTS "hrm_work_weeks" CASCADE;
CREATE TABLE IF NOT EXISTS "hrm_work_weeks" (
"id" SERIAL,
"mon" SMALLINT NOT NULL,
"tue" SMALLINT NOT NULL,
"wed" SMALLINT NOT NULL,
"thu" SMALLINT NOT NULL,
"fri" SMALLINT NOT NULL,
"sat" SMALLINT NOT NULL,
"sun" SMALLINT NOT NULL,
"working_days" SMALLINT NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `hr_failed_jobs`
--

DROP TABLE IF EXISTS "hr_failed_jobs" CASCADE;
CREATE TABLE IF NOT EXISTS "hr_failed_jobs" (
"id" BIGINT NOT NULL,
"uuid" varchar(255) NOT NULL,
"connection" TEXT NOT NULL,
"queue" TEXT NOT NULL,
"payload" TEXT NOT NULL,
"exception" TEXT NOT NULL,
"failed_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- --------------------------------------------------------

--
-- Table structure for table `hr_model_has_permissions`
--

DROP TABLE IF EXISTS "hr_model_has_permissions" CASCADE;
CREATE TABLE IF NOT EXISTS "hr_model_has_permissions" (
"permission_id" BIGINT NOT NULL,
"model_type" varchar(255) NOT NULL,
"model_id" BIGINT NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `hr_model_has_roles`
--

DROP TABLE IF EXISTS "hr_model_has_roles" CASCADE;
CREATE TABLE IF NOT EXISTS "hr_model_has_roles" (
"role_id" BIGINT NOT NULL,
"model_type" varchar(255) NOT NULL,
"model_id" BIGINT NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `hr_password_resets`
--

DROP TABLE IF EXISTS "hr_password_resets" CASCADE;
CREATE TABLE IF NOT EXISTS "hr_password_resets" (
"email" varchar(255) NOT NULL,
"token" varchar(255) NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `hr_permissions`
--

DROP TABLE IF EXISTS "hr_permissions" CASCADE;
CREATE TABLE IF NOT EXISTS "hr_permissions" (
"id" BIGINT NOT NULL,
"name" varchar(255) NOT NULL,
"guard_name" varchar(255) NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `hr_roles`
--

DROP TABLE IF EXISTS "hr_roles" CASCADE;
CREATE TABLE IF NOT EXISTS "hr_roles" (
"id" BIGINT NOT NULL,
"name" varchar(255) NOT NULL,
"guard_name" varchar(255) NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `hr_role_has_permissions`
--

DROP TABLE IF EXISTS "hr_role_has_permissions" CASCADE;
CREATE TABLE IF NOT EXISTS "hr_role_has_permissions" (
"permission_id" BIGINT NOT NULL,
"role_id" BIGINT NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `idcards`
--

DROP TABLE IF EXISTS "idcards" CASCADE;
CREATE TABLE IF NOT EXISTS "idcards" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"employee_id" INTEGER DEFAULT NULL,
"status" SMALLINT DEFAULT 0,
"issue_date" date DEFAULT NULL,
"expiry_date" date DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"reason" TEXT DEFAULT NULL,
"remarks" TEXT DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `increment_pfs`
--

DROP TABLE IF EXISTS "increment_pfs" CASCADE;
CREATE TABLE IF NOT EXISTS "increment_pfs" (
"id" SERIAL,
"role_id" varchar(191) DEFAULT NULL,
"staff_type" TEXT DEFAULT NULL,
"user_id" INTEGER DEFAULT NULL,
"reason" varchar(191) DEFAULT NULL,
"basic_salary" INTEGER DEFAULT NULL,
"pf_previous" INTEGER DEFAULT NULL,
"pf_new" INTEGER DEFAULT NULL,
"New_salary_increment" INTEGER DEFAULT NULL,
"Amount" INTEGER DEFAULT NULL,
"increment_date" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"medical" INTEGER DEFAULT NULL,
"house_rent" INTEGER DEFAULT NULL,
"convenyance" INTEGER DEFAULT NULL,
"previous_gross_salary" INTEGER DEFAULT NULL,
"ceo_approval" varchar(191) NOT NULL DEFAULT 'Pending',
"principal_approval" varchar(191) NOT NULL DEFAULT 'Pending',
"branch_id" INTEGER DEFAULT NULL,
"created_by" INTEGER DEFAULT 5,
"staff_id" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `installment_plans`
--

DROP TABLE IF EXISTS "installment_plans" CASCADE;
CREATE TABLE IF NOT EXISTS "installment_plans" (
"id" SERIAL,
"session_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER NOT NULL,
"program_id" INTEGER NOT NULL,
"class_id" INTEGER NOT NULL,
"fee_term_id" INTEGER NOT NULL,
"installment_no" INTEGER NOT NULL,
"installment_date" date NOT NULL,
"name" varchar(191) DEFAULT NULL,
"total_days" varchar(191) DEFAULT NULL,
"description" varchar(255) DEFAULT NULL,
"status" varchar(191) DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"group_id" INTEGER NOT NULL,
"intake_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `intake`
--

DROP TABLE IF EXISTS "intake" CASCADE;
CREATE TABLE IF NOT EXISTS "intake" (
"id" SERIAL,
"name" varchar(191) DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `in_out_logs`
--

DROP TABLE IF EXISTS "in_out_logs" CASCADE;
CREATE TABLE IF NOT EXISTS "in_out_logs" (
"id" BIGINT NOT NULL,
"user_id" INTEGER NOT NULL,
"in_time" time DEFAULT NULL,
"out_time" time DEFAULT NULL,
"time_calc" DOUBLE PRECISION DEFAULT NULL,
"date" date DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `job_post`
--

DROP TABLE IF EXISTS "job_post" CASCADE;
CREATE TABLE IF NOT EXISTS "job_post" (
"id" SERIAL,
"job_post_request_id" INTEGER NOT NULL,
"section" varchar(191) NOT NULL,
"education" varchar(191) NOT NULL,
"skill" varchar(191) NOT NULL,
"branch_id" INTEGER NOT NULL,
"experience" varchar(191) NOT NULL,
"expected_joining" date NOT NULL,
"public_link" varchar(191) NOT NULL,
"job_title" varchar(191) NOT NULL,
"description" varchar(191) DEFAULT NULL,
"location" varchar(191) NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `job_post_request`
--

DROP TABLE IF EXISTS "job_post_request" CASCADE;
CREATE TABLE IF NOT EXISTS "job_post_request" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"subject_id" INTEGER DEFAULT NULL,
"section" TEXT DEFAULT NULL,
"experience" varchar(191) DEFAULT NULL,
"gender" varchar(191) DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"education" varchar(191) DEFAULT NULL,
"expected_joining" date DEFAULT NULL,
"job_status" TEXT DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"job_title" varchar(191) DEFAULT NULL,
"job_category" varchar(100) DEFAULT NULL,
"skill" varchar(191) DEFAULT NULL,
"location" varchar(191) DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `labs`
--

DROP TABLE IF EXISTS "labs" CASCADE;
CREATE TABLE IF NOT EXISTS "labs" (
"id" SERIAL,
"name" varchar(191) NOT NULL,
"description" varchar(191) NOT NULL,
"status" TEXT NOT NULL DEFAULT 'Active',
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `lab_time_table`
--

DROP TABLE IF EXISTS "lab_time_table" CASCADE;
CREATE TABLE IF NOT EXISTS "lab_time_table" (
"id" SERIAL,
"time_table_id" INTEGER NOT NULL,
"lab_id" INTEGER NOT NULL,
"date" varchar(191) NOT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `learner_profiles`
--

DROP TABLE IF EXISTS "learner_profiles" CASCADE;
CREATE TABLE IF NOT EXISTS "learner_profiles" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"student_id" INTEGER DEFAULT NULL,
"inquirer" varchar(191) DEFAULT NULL,
"open_minded" varchar(191) DEFAULT NULL,
"knowledgeable" varchar(191) DEFAULT NULL,
"caring" varchar(191) DEFAULT NULL,
"thinker" varchar(191) DEFAULT NULL,
"courageous" varchar(191) DEFAULT NULL,
"communicator" varchar(191) DEFAULT NULL,
"balanced" varchar(191) DEFAULT NULL,
"principled" varchar(191) DEFAULT NULL,
"reflective" varchar(191) DEFAULT NULL,
"social" varchar(191) DEFAULT NULL,
"research" varchar(191) DEFAULT NULL,
"thinking" varchar(191) DEFAULT NULL,
"self_management" varchar(191) DEFAULT NULL,
"communication" varchar(191) DEFAULT NULL,
"appreciation" varchar(191) DEFAULT NULL,
"curiosity" varchar(191) DEFAULT NULL,
"creativity" varchar(191) DEFAULT NULL,
"cooperation" varchar(191) DEFAULT NULL,
"integrity" varchar(191) DEFAULT NULL,
"empathy" varchar(191) DEFAULT NULL,
"independence" varchar(191) DEFAULT NULL,
"confidence" varchar(191) DEFAULT NULL,
"enthusiasm" varchar(191) DEFAULT NULL,
"respect" varchar(191) DEFAULT NULL,
"commitment" varchar(191) DEFAULT NULL,
"tolerance" varchar(191) DEFAULT NULL,
"status" varchar(191) NOT NULL DEFAULT '0',
"created_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `leavemanagements`
--

DROP TABLE IF EXISTS "leavemanagements" CASCADE;
CREATE TABLE IF NOT EXISTS "leavemanagements" (
"id" SERIAL,
"active_session_teacher_id" INTEGER DEFAULT NULL,
"staff_id" INTEGER NOT NULL,
"course_id" INTEGER DEFAULT NULL,
"leave_type" varchar(191) DEFAULT NULL,
"leave_date" date DEFAULT NULL,
"start_date" date DEFAULT NULL,
"end_date" date DEFAULT NULL,
"no_of_leaves" INTEGER DEFAULT NULL,
"status" varchar(191) NOT NULL DEFAULT 'Pending',
"approver_id" INTEGER NOT NULL,
"approver_role" varchar(191) NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `leave_type_staff_types`
--

DROP TABLE IF EXISTS "leave_type_staff_types" CASCADE;
CREATE TABLE IF NOT EXISTS "leave_type_staff_types" (
"id" SERIAL,
"leave_type_id" INTEGER NOT NULL,
"staff_type_id" INTEGER NOT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `lecture_base_salarysheet_child_model`
--

DROP TABLE IF EXISTS "lecture_base_salarysheet_child_model" CASCADE;
CREATE TABLE IF NOT EXISTS "lecture_base_salarysheet_child_model" (
"id" SERIAL,
"lecture_base_parent_id" INTEGER DEFAULT NULL,
"salary_sheet_code" INTEGER DEFAULT NULL,
"staff_id" INTEGER DEFAULT NULL,
"course_id" INTEGER DEFAULT NULL,
"total_lectures_attend" INTEGER DEFAULT NULL,
"total_lectures_assigned" INTEGER DEFAULT NULL,
"lecture_duration_hour" INTEGER DEFAULT NULL,
"lecture_attendend_duration" INTEGER DEFAULT NULL,
"per_course_charges" INTEGER DEFAULT NULL,
"total_hours" INTEGER DEFAULT NULL,
"total_per_lecture" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `lecture_base_salarysheet_parent_model`
--

DROP TABLE IF EXISTS "lecture_base_salarysheet_parent_model" CASCADE;
CREATE TABLE IF NOT EXISTS "lecture_base_salarysheet_parent_model" (
"id" SERIAL,
"sheet_code" varchar(191) NOT NULL,
"staff_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER NOT NULL,
"date_to" date NOT NULL,
"date_from" date NOT NULL,
"per_course_charges" INTEGER DEFAULT NULL,
"total_amount" INTEGER DEFAULT NULL,
"net_amount" INTEGER NOT NULL,
"tax_amount" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"date" date NOT NULL,
"status" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `lessons`
--

DROP TABLE IF EXISTS "lessons" CASCADE;
CREATE TABLE IF NOT EXISTS "lessons" (
"id" SERIAL,
"class_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"semesters_id" INTEGER DEFAULT NULL,
"teacher_id" INTEGER DEFAULT NULL,
"weekday" INTEGER DEFAULT NULL,
"start_time" time DEFAULT NULL,
"end_time" time DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `library_circulation`
--

DROP TABLE IF EXISTS "library_circulation" CASCADE;
CREATE TABLE IF NOT EXISTS "library_circulation" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"user_type" varchar(100) NOT NULL,
"slug" varchar(100) NOT NULL,
"code_prefix" varchar(50) NOT NULL,
"issue_limit_days" INTEGER DEFAULT NULL,
"issue_limit_books" INTEGER DEFAULT NULL,
"fine_per_day" INTEGER DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `library_members`
--

DROP TABLE IF EXISTS "library_members" CASCADE;
CREATE TABLE IF NOT EXISTS "library_members" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"branch_id" INTEGER NOT NULL,
"user_id" INTEGER DEFAULT NULL,
"user_type" INTEGER NOT NULL,
"member_id" INTEGER NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `loans`
--

DROP TABLE IF EXISTS "loans" CASCADE;
CREATE TABLE IF NOT EXISTS "loans" (
"id" SERIAL,
"loan_request_id" INTEGER NOT NULL,
"amount" INTEGER DEFAULT NULL,
"type" TEXT NOT NULL,
"salary_deduct" TEXT NOT NULL,
"paid_status" TEXT NOT NULL,
"return_date" date DEFAULT NULL,
"remaining" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"role_id" INTEGER DEFAULT NULL,
"employee_id" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `login_detail`
--

DROP TABLE IF EXISTS "login_detail" CASCADE;
CREATE TABLE IF NOT EXISTS "login_detail" (
"id" SERIAL,
"user_id" INTEGER NOT NULL,
"start_time" varchar(191) NOT NULL,
"end_time" varchar(191) NOT NULL,
"status" TEXT NOT NULL DEFAULT '1',
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `login_details`
--

DROP TABLE IF EXISTS "login_details" CASCADE;
CREATE TABLE IF NOT EXISTS "login_details" (
"id" SERIAL,
"user_id" INTEGER NOT NULL,
"start_time" varchar(191) NOT NULL,
"end_time" varchar(191) NOT NULL,
"status" varchar(191) NOT NULL DEFAULT '1',
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS "migrations" CASCADE;
CREATE TABLE IF NOT EXISTS "migrations" (
"id" SERIAL,
"migration" varchar(191) NOT NULL,
"batch" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `months`
--

DROP TABLE IF EXISTS "months" CASCADE;
CREATE TABLE IF NOT EXISTS "months" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"title" varchar(10) NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `notes`
--

DROP TABLE IF EXISTS "notes" CASCADE;
CREATE TABLE IF NOT EXISTS "notes" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"member_type" varchar(8) NOT NULL,
"member_id" INTEGER NOT NULL,
"subject" varchar(100) NOT NULL,
"note" TEXT DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `notices`
--

DROP TABLE IF EXISTS "notices" CASCADE;
CREATE TABLE IF NOT EXISTS "notices" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"title" varchar(191) DEFAULT NULL,
"message" varchar(191) DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"class_id" INTEGER DEFAULT NULL,
"section_id" INTEGER DEFAULT NULL,
"board_id" INTEGER NOT NULL,
"publish_date" TIMESTAMP DEFAULT NULL,
"end_date" TIMESTAMP DEFAULT NULL,
"display_group" TEXT DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS "notifications" CASCADE;
CREATE TABLE IF NOT EXISTS "notifications" (
"id" SERIAL,
"sid" INTEGER NOT NULL,
"rid" INTEGER NOT NULL,
"title" varchar(200) DEFAULT NULL,
"reason" varchar(500) DEFAULT NULL,
"justification" TEXT NOT NULL,
"status" varchar(100) DEFAULT NULL,
"type" varchar(100) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `parent_details`
--

DROP TABLE IF EXISTS "parent_details" CASCADE;
CREATE TABLE IF NOT EXISTS "parent_details" (
"id" SERIAL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"students_id" INTEGER DEFAULT NULL,
"grandfather_first_name" varchar(191) DEFAULT NULL,
"grandfather_middle_name" varchar(191) DEFAULT NULL,
"grandfather_last_name" varchar(191) DEFAULT NULL,
"father_eligibility" varchar(191) DEFAULT NULL,
"father_office" varchar(191) DEFAULT NULL,
"father_office_number" varchar(191) DEFAULT NULL,
"father_residence_number" varchar(191) DEFAULT NULL,
"mother_eligibility" varchar(191) DEFAULT NULL,
"mother_office" varchar(191) DEFAULT NULL,
"mother_office_number" varchar(191) DEFAULT NULL,
"mother_residence_number" varchar(191) DEFAULT NULL,
"father_image" varchar(191) DEFAULT NULL,
"mother_image" varchar(191) DEFAULT NULL,
"father_first_name" varchar(15) DEFAULT NULL,
"father_middle_name" varchar(15) DEFAULT NULL,
"father_last_name" varchar(15) DEFAULT NULL,
"father_occupation" varchar(15) DEFAULT NULL,
"father_email" varchar(255) DEFAULT NULL,
"father_mobile_1" varchar(15) DEFAULT NULL,
"father_cnic" varchar(50) DEFAULT NULL,
"mother_first_name" varchar(50) DEFAULT NULL,
"mother_middle_name" varchar(100) DEFAULT NULL,
"mother_last_name" varchar(15) DEFAULT NULL,
"mother_cnic" varchar(15) DEFAULT NULL,
"mother_occupation" varchar(15) DEFAULT NULL,
"mother_mobile_1" varchar(15) DEFAULT NULL,
"mother_email" varchar(100) DEFAULT NULL,
"parent_image" varchar(191) DEFAULT NULL,
"guardian_is" varchar(255) DEFAULT NULL,
"guardian_first_name" varchar(15) DEFAULT NULL,
"guardian_middle_name" varchar(15) DEFAULT NULL,
"guardian_last_name" varchar(50) DEFAULT NULL,
"guardian_occupation" varchar(50) DEFAULT NULL,
"guardian_address" varchar(100) DEFAULT NULL,
"guardian_residence_number" varchar(15) DEFAULT NULL,
"guardian_mobile_1" varchar(15) DEFAULT NULL,
"guardian_cnic" varchar(15) DEFAULT NULL,
"guardian_email" varchar(15) DEFAULT NULL,
"guardian_relation" varchar(100) DEFAULT NULL,
"filer_info" SMALLINT NOT NULL,
"status" SMALLINT DEFAULT 1,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS "password_resets" CASCADE;
CREATE TABLE IF NOT EXISTS "password_resets" (
"email" varchar(191) NOT NULL,
"token" varchar(191) NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `past_paper`
--

DROP TABLE IF EXISTS "past_paper" CASCADE;
CREATE TABLE IF NOT EXISTS "past_paper" (
"id" SERIAL,
"active_session_id" INTEGER NOT NULL,
"program" INTEGER DEFAULT NULL,
"class_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"subject_id" INTEGER NOT NULL,
"year" INTEGER DEFAULT NULL,
"document_type" TEXT DEFAULT NULL,
"title" varchar(191) DEFAULT NULL,
"file" varchar(191) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 0,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `payment_methods`
--

DROP TABLE IF EXISTS "payment_methods" CASCADE;
CREATE TABLE IF NOT EXISTS "payment_methods" (
"id" SERIAL,
"name" varchar(191) DEFAULT NULL,
"payment_type" SMALLINT DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `payment_settings`
--

DROP TABLE IF EXISTS "payment_settings" CASCADE;
CREATE TABLE IF NOT EXISTS "payment_settings" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"identity" varchar(15) NOT NULL,
"logo" varchar(15) NOT NULL,
"link" varchar(100) NOT NULL,
"config" TEXT NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `payrolls`
--

DROP TABLE IF EXISTS "payrolls" CASCADE;
CREATE TABLE IF NOT EXISTS "payrolls" (
"id" BIGINT NOT NULL,
"full_name" varchar(255) DEFAULT NULL,
"gross" decimal(10,2) NOT NULL DEFAULT 0.00,
"deduction" decimal(10,2) NOT NULL DEFAULT 0.00,
"arrears" decimal(10,2) NOT NULL DEFAULT 0.00,
"after" decimal(10,2) NOT NULL DEFAULT 0.00,
"epf" decimal(10,2) NOT NULL DEFAULT 0.00,
"eobi" decimal(10,2) NOT NULL DEFAULT 0.00,
"tax" decimal(10,2) NOT NULL DEFAULT 0.00,
"training" decimal(10,2) NOT NULL DEFAULT 0.00,
"loan" decimal(10,2) NOT NULL DEFAULT 0.00,
"other_deduction" decimal(10,2) NOT NULL DEFAULT 0.00,
"net_salary" decimal(10,2) NOT NULL DEFAULT 0.00,
"remarks" TEXT DEFAULT NULL,
"status" varchar(255) DEFAULT NULL,
"staff_id" BIGINT DEFAULT NULL,
"staff_type_id" BIGINT DEFAULT NULL,
"branch_id" BIGINT DEFAULT NULL,
"creator_id" BIGINT DEFAULT NULL,
"month" varchar(255) DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `payroll_employees`
--

DROP TABLE IF EXISTS "payroll_employees" CASCADE;
CREATE TABLE IF NOT EXISTS "payroll_employees" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"month_year" varchar(10) NOT NULL,
"employee_id" INTEGER NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 0,
"created_by" INTEGER NOT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS "permissions" CASCADE;
CREATE TABLE IF NOT EXISTS "permissions" (
"id" BIGINT NOT NULL,
"group" varchar(255) DEFAULT NULL,
"name" varchar(255) NOT NULL,
"display_name" varchar(255) DEFAULT NULL,
"description" varchar(255) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `permission_role`
--

DROP TABLE IF EXISTS "permission_role" CASCADE;
CREATE TABLE IF NOT EXISTS "permission_role" (
"permission_id" BIGINT NOT NULL,
"role_id" BIGINT NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `permission_user`
--

DROP TABLE IF EXISTS "permission_user" CASCADE;
CREATE TABLE IF NOT EXISTS "permission_user" (
"permission_id" BIGINT NOT NULL,
"user_id" BIGINT NOT NULL,
"user_type" varchar(255) NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS "personal_access_tokens" CASCADE;
CREATE TABLE IF NOT EXISTS "personal_access_tokens" (
"id" BIGINT NOT NULL,
"tokenable_type" varchar(255) NOT NULL,
"tokenable_id" BIGINT NOT NULL,
"name" varchar(255) NOT NULL,
"token" varchar(64) NOT NULL,
"abilities" TEXT DEFAULT NULL,
"last_used_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `portfolio`
--

DROP TABLE IF EXISTS "portfolio" CASCADE;
CREATE TABLE IF NOT EXISTS "portfolio" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"subjects_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"student_id" INTEGER DEFAULT NULL,
"title" varchar(100) NOT NULL,
"description" TEXT DEFAULT NULL,
"date" date DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `portfolio_files`
--

DROP TABLE IF EXISTS "portfolio_files" CASCADE;
CREATE TABLE IF NOT EXISTS "portfolio_files" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"portfolio_id" INTEGER DEFAULT NULL,
"file" TEXT DEFAULT NULL,
"download_file" varchar(191) DEFAULT NULL,
"download_image" varchar(191) DEFAULT NULL,
"download_video" varchar(191) DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `prerequisite`
--

DROP TABLE IF EXISTS "prerequisite" CASCADE;
CREATE TABLE IF NOT EXISTS "prerequisite" (
"id" SERIAL,
"session_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"precourse_id" INTEGER DEFAULT NULL,
"course_id" INTEGER DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS "product" CASCADE;
CREATE TABLE IF NOT EXISTS "product" (
"id" SERIAL,
"name" varchar(191) NOT NULL,
"b_id" INTEGER NOT NULL,
"c_id" INTEGER NOT NULL,
"uom_id" INTEGER NOT NULL,
"description" varchar(191) DEFAULT NULL,
"selling_price" INTEGER DEFAULT NULL,
"purchasing_price" INTEGER DEFAULT NULL,
"code" INTEGER DEFAULT NULL,
"barcode" varchar(191) DEFAULT NULL,
"classification" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS "products" CASCADE;
CREATE TABLE IF NOT EXISTS "products" (
"id" SERIAL,
"code" DOUBLE PRECISION NOT NULL,
"barcode" DOUBLE PRECISION NOT NULL,
"name" TEXT NOT NULL,
"product_type" varchar(255) NOT NULL,
"product_classification" varchar(255) NOT NULL,
"fbr_code" TEXT DEFAULT NULL,
"hs_code" TEXT DEFAULT NULL,
"brand_id" INTEGER NOT NULL,
"category_id" INTEGER NOT NULL,
"description" TEXT DEFAULT NULL,
"uom_id" INTEGER NOT NULL,
"created_by" INTEGER NOT NULL,
"updated_by" INTEGER NOT NULL,
"created_at" TIMESTAMP NOT NULL,
"updated_at" TIMESTAMP NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `programs`
--

DROP TABLE IF EXISTS "programs" CASCADE;
CREATE TABLE IF NOT EXISTS "programs" (
"id" SERIAL,
"tier_id" INTEGER NOT NULL DEFAULT 0,
"name" varchar(191) NOT NULL,
"branch_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"grading_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"term" INTEGER DEFAULT NULL,
"basic_fee" varchar(191) DEFAULT NULL,
"code" varchar(191) DEFAULT NULL,
"start_month" varchar(191) DEFAULT NULL,
"end_month" varchar(191) DEFAULT NULL,
"duration" INTEGER DEFAULT NULL,
"selectable_subjects" SMALLINT NOT NULL DEFAULT 0,
"program" varchar(191) DEFAULT NULL,
"fee_type_id" INTEGER DEFAULT NULL,
"description" varchar(191) NOT NULL,
"years" INTEGER NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `program_subject`
--

DROP TABLE IF EXISTS "program_subject" CASCADE;
CREATE TABLE IF NOT EXISTS "program_subject" (
"id" SERIAL,
"program_id" INTEGER DEFAULT NULL,
"subject_detail_id" INTEGER DEFAULT NULL,
"term_id" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `program_term`
--

DROP TABLE IF EXISTS "program_term" CASCADE;
CREATE TABLE IF NOT EXISTS "program_term" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"program_id" INTEGER NOT NULL,
"branch_id" INTEGER NOT NULL,
"term" varchar(255) DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `program_terms`
--

DROP TABLE IF EXISTS "program_terms" CASCADE;
CREATE TABLE IF NOT EXISTS "program_terms" (
"id" SERIAL,
"program_id" INTEGER NOT NULL,
"term_id" INTEGER NOT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `promotion`
--

DROP TABLE IF EXISTS "promotion" CASCADE;
CREATE TABLE IF NOT EXISTS "promotion" (
"id" SERIAL,
"staff_id" INTEGER NOT NULL,
"from_designation" INTEGER NOT NULL,
"to_designation" INTEGER NOT NULL,
"date" date NOT NULL,
"status" varchar(255) NOT NULL,
"reason" varchar(255) NOT NULL,
"created_by" INTEGER NOT NULL,
"approved_by" varchar(255) NOT NULL,
"created_at" date NOT NULL,
"updated_at" date NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `published_exam`
--

DROP TABLE IF EXISTS "published_exam" CASCADE;
CREATE TABLE IF NOT EXISTS "published_exam" (
"id" SERIAL,
"datesheet_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"created_at" INTEGER DEFAULT NULL,
"updated_at" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `quiz`
--

DROP TABLE IF EXISTS "quiz" CASCADE;
CREATE TABLE IF NOT EXISTS "quiz" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"title" varchar(100) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `quizzes`
--

DROP TABLE IF EXISTS "quizzes" CASCADE;
CREATE TABLE IF NOT EXISTS "quizzes" (
"id" SERIAL,
"active_session_teacher_id" INTEGER DEFAULT NULL,
"title" varchar(191) DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"status" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"branch_id" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `quiz_mark_ledgers`
--

DROP TABLE IF EXISTS "quiz_mark_ledgers" CASCADE;
CREATE TABLE IF NOT EXISTS "quiz_mark_ledgers" (
"id" SERIAL,
"quiz_schedule_id" INTEGER DEFAULT NULL,
"students_id" INTEGER DEFAULT NULL,
"obtain_mark_theory" INTEGER DEFAULT NULL,
"absent_theory" INTEGER DEFAULT NULL,
"sorting_order" INTEGER DEFAULT NULL,
"status" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `quiz_schedules`
--

DROP TABLE IF EXISTS "quiz_schedules" CASCADE;
CREATE TABLE IF NOT EXISTS "quiz_schedules" (
"id" SERIAL,
"quiz_id" INTEGER DEFAULT NULL,
"date" varchar(191) DEFAULT NULL,
"full_mark_theory" INTEGER DEFAULT NULL,
"pass_mark_theory" INTEGER DEFAULT NULL,
"approved" INTEGER DEFAULT NULL,
"quiz_check" INTEGER DEFAULT NULL,
"conducted" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"status" SMALLINT DEFAULT NULL,
"publish_status" SMALLINT DEFAULT NULL,
"exams_id" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `quiz_timetables`
--

DROP TABLE IF EXISTS "quiz_timetables" CASCADE;
CREATE TABLE IF NOT EXISTS "quiz_timetables" (
"id" SERIAL,
"active_session_section_id" INTEGER DEFAULT NULL,
"title" varchar(191) DEFAULT NULL,
"type" INTEGER DEFAULT NULL,
"start" TIMESTAMP DEFAULT NULL,
"end" TIMESTAMP DEFAULT NULL,
"color" varchar(191) DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"status" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `recruitment_feedback`
--

DROP TABLE IF EXISTS "recruitment_feedback" CASCADE;
CREATE TABLE IF NOT EXISTS "recruitment_feedback" (
"id" SERIAL,
"candidate_form_id" INTEGER NOT NULL,
"job_post_id" INTEGER DEFAULT NULL,
"status" TEXT DEFAULT NULL,
"category" varchar(191) DEFAULT NULL,
"confidence" varchar(191) DEFAULT NULL,
"communication" varchar(191) DEFAULT NULL,
"knowledge" varchar(191) DEFAULT NULL,
"remarks" varchar(1000) DEFAULT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- --------------------------------------------------------

--
-- Table structure for table `report_groups`
--

DROP TABLE IF EXISTS "report_groups" CASCADE;
CREATE TABLE IF NOT EXISTS "report_groups" (
"id" SERIAL,
"name" varchar(191) DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `report_parameters`
--

DROP TABLE IF EXISTS "report_parameters" CASCADE;
CREATE TABLE IF NOT EXISTS "report_parameters" (
"id" SERIAL,
"reportGroup_id" INTEGER DEFAULT NULL,
"name" varchar(191) DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"range" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `requested_goods_branches`
--

DROP TABLE IF EXISTS "requested_goods_branches" CASCADE;
CREATE TABLE IF NOT EXISTS "requested_goods_branches" (
"id" SERIAL,
"goods_request_process_id" INTEGER NOT NULL,
"product_id" INTEGER DEFAULT NULL,
"qty_asked" INTEGER DEFAULT NULL,
"qty_assigned" INTEGER DEFAULT NULL,
"qty_recieved" INTEGER DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 0,
"branch_id" INTEGER DEFAULT NULL,
"requested_branch_id" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `request_approvals`
--

DROP TABLE IF EXISTS "request_approvals" CASCADE;
CREATE TABLE IF NOT EXISTS "request_approvals" (
"id" SERIAL,
"leave_request_id" INTEGER DEFAULT NULL,
"new_employee_request_id" INTEGER DEFAULT NULL,
"approver_id" INTEGER DEFAULT NULL,
"STATUS" varchar(20) DEFAULT 'Pending',
"approval_date" TIMESTAMP DEFAULT NULL,
"comments" TEXT DEFAULT NULL,
"approval_level" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `request_loan_employee`
--

DROP TABLE IF EXISTS "request_loan_employee" CASCADE;
CREATE TABLE IF NOT EXISTS "request_loan_employee" (
"id" SERIAL,
"staff_id" INTEGER NOT NULL,
"branch_id" INTEGER NOT NULL,
"attachment_file" varchar(255) DEFAULT NULL,
"effective_from" date NOT NULL,
"type" varchar(100) NOT NULL,
"amount" INTEGER NOT NULL,
"installments" INTEGER NOT NULL,
"monthly_installment" INTEGER DEFAULT NULL,
"reason" TEXT DEFAULT NULL,
"remarks" TEXT DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 0,
"approved_by_ceo" SMALLINT NOT NULL DEFAULT 0,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- --------------------------------------------------------

--
-- Table structure for table `residents`
--

DROP TABLE IF EXISTS "residents" CASCADE;
CREATE TABLE IF NOT EXISTS "residents" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"hostels_id" INTEGER NOT NULL,
"rooms_id" INTEGER DEFAULT NULL,
"beds_id" INTEGER DEFAULT NULL,
"user_type" INTEGER NOT NULL,
"member_id" INTEGER NOT NULL,
"register_date" TIMESTAMP NOT NULL,
"leave_date" TIMESTAMP DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `resident_histories`
--

DROP TABLE IF EXISTS "resident_histories" CASCADE;
CREATE TABLE IF NOT EXISTS "resident_histories" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"years_id" INTEGER NOT NULL,
"hostels_id" INTEGER NOT NULL,
"rooms_id" INTEGER DEFAULT NULL,
"beds_id" INTEGER DEFAULT NULL,
"residents_id" INTEGER NOT NULL,
"history_type" TEXT NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `resigns`
--

DROP TABLE IF EXISTS "resigns" CASCADE;
CREATE TABLE IF NOT EXISTS "resigns" (
"id" SERIAL,
"user_id" BIGINT NOT NULL,
"reason" varchar(500) NOT NULL,
"join_date" date DEFAULT NULL,
"notice_period" varchar(191) NOT NULL,
"experience_letter" varchar(191) DEFAULT NULL,
"approved_by_ceo" varchar(191) DEFAULT 'Pending',
"approved_by_hr_head" varchar(191) DEFAULT 'Pending',
"class" varchar(191) DEFAULT NULL,
"subject" varchar(191) DEFAULT NULL,
"last_day_of_work" varchar(191) DEFAULT NULL,
"status" varchar(100) DEFAULT 'Pending',
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"branch_id" INTEGER NOT NULL,
"role_id" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `restricted_leave_months`
--

DROP TABLE IF EXISTS "restricted_leave_months" CASCADE;
CREATE TABLE IF NOT EXISTS "restricted_leave_months" (
"id" SERIAL,
"month" INTEGER NOT NULL,
"year" INTEGER NOT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `return_policies`
--

DROP TABLE IF EXISTS "return_policies" CASCADE;
CREATE TABLE IF NOT EXISTS "return_policies" (
"id" SERIAL,
"name" varchar(191) NOT NULL,
"description" varchar(191) NOT NULL,
"status" TEXT NOT NULL DEFAULT 'Active',
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS "roles" CASCADE;
CREATE TABLE IF NOT EXISTS "roles" (
"id" BIGINT NOT NULL,
"name" varchar(255) NOT NULL,
"display_name" varchar(255) DEFAULT NULL,
"description" varchar(255) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `role_user`
--

DROP TABLE IF EXISTS "role_user" CASCADE;
CREATE TABLE IF NOT EXISTS "role_user" (
"role_id" BIGINT NOT NULL,
"user_id" BIGINT NOT NULL,
"user_type" varchar(255) NOT NULL,
"updated_at" varchar(11) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS "rooms" CASCADE;
CREATE TABLE IF NOT EXISTS "rooms" (
"id" SERIAL,
"building_id" INTEGER DEFAULT NULL,
"room_type_id" INTEGER DEFAULT NULL,
"name" varchar(191) NOT NULL,
"description" INTEGER DEFAULT NULL,
"status" TEXT NOT NULL DEFAULT 'Active',
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `room_types`
--

DROP TABLE IF EXISTS "room_types" CASCADE;
CREATE TABLE IF NOT EXISTS "room_types" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"title" varchar(25) NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `schedule`
--

DROP TABLE IF EXISTS "schedule" CASCADE;
CREATE TABLE IF NOT EXISTS "schedule" (
"id" SERIAL,
"candidate_form_id" INTEGER NOT NULL,
"job_post_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"test_time" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"test_venue" varchar(200) NOT NULL,
"test_feedback" INTEGER DEFAULT NULL,
"interview_time" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"interview_venue" varchar(200) NOT NULL,
"interview_feedback" INTEGER DEFAULT NULL,
"test_doc" varchar(191) DEFAULT NULL,
"interview_doc" varchar(191) DEFAULT NULL,
"status" TEXT NOT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `scholarship_settings`
--

DROP TABLE IF EXISTS "scholarship_settings" CASCADE;
CREATE TABLE IF NOT EXISTS "scholarship_settings" (
"id" INTEGER NOT NULL,
"session_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"maximum_limit" INTEGER NOT NULL,
"status" INTEGER NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- --------------------------------------------------------

--
-- Table structure for table `sections`
--

DROP TABLE IF EXISTS "sections" CASCADE;
CREATE TABLE IF NOT EXISTS "sections" (
"id" SERIAL,
"name" varchar(191) NOT NULL,
"description" varchar(191) NOT NULL,
"status" TEXT NOT NULL DEFAULT 'Active',
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `semesters`
--

DROP TABLE IF EXISTS "semesters" CASCADE;
CREATE TABLE IF NOT EXISTS "semesters" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"semester" varchar(50) NOT NULL,
"slug" varchar(50) NOT NULL,
"staff_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"gradingType_id" INTEGER DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `services_type`
--

DROP TABLE IF EXISTS "services_type" CASCADE;
CREATE TABLE IF NOT EXISTS "services_type" (
"id" SERIAL,
"name" varchar(191) DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS "sessions" CASCADE;
CREATE TABLE IF NOT EXISTS "sessions" (
"id" SERIAL,
"title" varchar(191) NOT NULL,
"start_year" varchar(191) NOT NULL,
"end_year" varchar(191) NOT NULL,
"no_of_years" varchar(191) NOT NULL,
"active_status" SMALLINT DEFAULT NULL,
"status" TEXT NOT NULL DEFAULT 'Active',
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `shared_todos`
--

DROP TABLE IF EXISTS "shared_todos" CASCADE;
CREATE TABLE IF NOT EXISTS "shared_todos" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"group_id" INTEGER DEFAULT NULL,
"todo" varchar(191) DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `sms_settings`
--

DROP TABLE IF EXISTS "sms_settings" CASCADE;
CREATE TABLE IF NOT EXISTS "sms_settings" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"identity" varchar(15) NOT NULL,
"logo" varchar(15) NOT NULL,
"link" varchar(100) NOT NULL,
"config" TEXT NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `sos_staff_history`
--

DROP TABLE IF EXISTS "sos_staff_history" CASCADE;
CREATE TABLE IF NOT EXISTS "sos_staff_history" (
"id" SERIAL,
"staff_id" INTEGER NOT NULL,
"date" date NOT NULL,
"last_working_day" date NOT NULL,
"reason" varchar(255) DEFAULT NULL,
"status" varchar(255) DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"updated_by" INTEGER NOT NULL,
"created_at" date NOT NULL,
"updated_at" date NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS "staff" CASCADE;
CREATE TABLE IF NOT EXISTS "staff" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"reports_to" INTEGER DEFAULT NULL,
"replaced_by" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"user_id" INTEGER NOT NULL,
"working_hours" INTEGER DEFAULT NULL,
"work_shift_id" INTEGER DEFAULT NULL,
"reg_no" varchar(191) DEFAULT NULL,
"relation" TEXT DEFAULT NULL,
"pemail" varchar(1000) DEFAULT NULL,
"marital_status" TEXT DEFAULT NULL,
"expiry_date" date DEFAULT NULL,
"class_level" varchar(1000) DEFAULT NULL,
"training" INTEGER DEFAULT NULL,
"staff_type" varchar(191) NOT NULL,
"join_date" date DEFAULT NULL,
"first_name" varchar(191) DEFAULT NULL,
"middle_name" varchar(191) DEFAULT NULL,
"last_name" varchar(191) DEFAULT NULL,
"father_name" varchar(191) DEFAULT NULL,
"mother_name" varchar(191) DEFAULT NULL,
"date_of_birth" varchar(191) DEFAULT NULL,
"ntn" varchar(191) DEFAULT NULL,
"conveyance" varchar(191) DEFAULT NULL,
"house_rent" varchar(191) DEFAULT NULL,
"provident_fund" varchar(191) DEFAULT NULL,
"provident_amount" varchar(191) DEFAULT NULL,
"medical_allowances" varchar(191) DEFAULT NULL,
"filer_type" varchar(191) DEFAULT NULL,
"gender" varchar(191) DEFAULT NULL,
"blood_group" varchar(191) DEFAULT NULL,
"nationality" varchar(191) DEFAULT NULL,
"mother_tongue" varchar(191) DEFAULT NULL,
"address" varchar(191) DEFAULT NULL,
"country" varchar(191) DEFAULT NULL,
"city" varchar(191) DEFAULT NULL,
"temp_address" varchar(191) DEFAULT NULL,
"home_phone" varchar(191) DEFAULT NULL,
"mobile_1" varchar(191) DEFAULT NULL,
"mobile_2" varchar(191) DEFAULT NULL,
"email" varchar(191) NOT NULL,
"qualification" varchar(191) DEFAULT NULL,
"experience" varchar(191) DEFAULT NULL,
"other_info" varchar(191) DEFAULT NULL,
"staff_image" varchar(191) DEFAULT NULL,
"skill" varchar(191) DEFAULT NULL,
"salary" varchar(191) DEFAULT NULL,
"salary_per_hour" varchar(191) DEFAULT NULL,
"password" varchar(191) NOT NULL,
"cnic" varchar(191) NOT NULL,
"status" TEXT DEFAULT 'Active',
"sos_date" date DEFAULT NULL,
"sos_reason" varchar(1000) DEFAULT NULL,
"job_status" TEXT DEFAULT NULL,
"start_day_contract" varchar(191) DEFAULT NULL,
"end_day_contract" varchar(191) DEFAULT NULL,
"probation" varchar(191) DEFAULT NULL,
"bank_id" INTEGER DEFAULT NULL,
"is_iban" varchar(1) DEFAULT NULL,
"bank_account" TEXT DEFAULT NULL,
"bank_branch" TEXT DEFAULT NULL,
"account_title" TEXT DEFAULT NULL,
"account_number" varchar(191) DEFAULT NULL,
"basic_salary" INTEGER DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"epf_join_date" date DEFAULT NULL,
"epf" TEXT DEFAULT 'No',
"epf_amount" INTEGER DEFAULT NULL,
"eobi_amount" INTEGER DEFAULT NULL,
"epf_paid" INTEGER DEFAULT NULL,
"eobi_govt_id" INTEGER DEFAULT NULL,
"eobi_join_date" date DEFAULT NULL,
"eobi" TEXT DEFAULT 'No',
"staff_type_id" INTEGER DEFAULT NULL,
"designation" varchar(191) DEFAULT NULL,
"department_id" INTEGER DEFAULT NULL,
"tax_percentage" INTEGER DEFAULT NULL,
"experience_info" varchar(191) DEFAULT NULL,
"state" varchar(191) DEFAULT NULL,
"temp_state" varchar(191) DEFAULT NULL,
"temp_country" varchar(191) DEFAULT NULL,
"view_sos_status" INTEGER DEFAULT 0,
"epf_date" date DEFAULT NULL,
"epf_description" varchar(255) NOT NULL,
"epf_opening_amount" INTEGER NOT NULL,
"eobi_opening_amount" INTEGER NOT NULL,
"payment_type" varchar(191) DEFAULT NULL,
"first_registration_code" varchar(250) DEFAULT NULL,
"disability" SMALLINT NOT NULL DEFAULT 0,
"disability_description" varchar(255) DEFAULT NULL,
"cnic_attachment" varchar(255) DEFAULT NULL,
"cnic_issue_date" date DEFAULT NULL,
"cnic_expiry_date" date DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `staff_assets`
--

DROP TABLE IF EXISTS "staff_assets" CASCADE;
CREATE TABLE IF NOT EXISTS "staff_assets" (
"id" SERIAL,
"staff_id" INTEGER NOT NULL,
"asset_id" INTEGER DEFAULT NULL,
"asset_name" varchar(191) NOT NULL,
"asset_type" varchar(100) DEFAULT NULL,
"serial_number" varchar(191) DEFAULT NULL,
"asset_code" varchar(100) DEFAULT NULL,
"issue_date" date DEFAULT NULL,
"return_date" date DEFAULT NULL,
"condition" varchar(50) DEFAULT NULL,
"remarks" TEXT DEFAULT NULL,
"attachment" varchar(255) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `staff_bank_accounts`
--

DROP TABLE IF EXISTS "staff_bank_accounts" CASCADE;
CREATE TABLE IF NOT EXISTS "staff_bank_accounts" (
"id" SERIAL,
"staff_reg_no" varchar(100) DEFAULT NULL,
"account_title" varchar(100) DEFAULT NULL,
"account_number" varchar(100) DEFAULT NULL,
"bank_branch" varchar(100) DEFAULT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"staff_id" INTEGER DEFAULT NULL,
"staff_bi_id" INTEGER DEFAULT NULL,
"status" varchar(191) NOT NULL DEFAULT 'InActive'
);


-- --------------------------------------------------------

--
-- Table structure for table `staff_basic_information`
--

DROP TABLE IF EXISTS "staff_basic_information" CASCADE;
CREATE TABLE IF NOT EXISTS "staff_basic_information" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"reports_to" INTEGER DEFAULT NULL,
"replaced_by" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"user_id" INTEGER NOT NULL,
"working_hours" INTEGER DEFAULT NULL,
"work_shift_id" INTEGER DEFAULT NULL,
"reg_no" varchar(191) DEFAULT NULL,
"relation" TEXT DEFAULT NULL,
"pemail" varchar(1000) DEFAULT NULL,
"marital_status" TEXT DEFAULT NULL,
"expiry_date" date DEFAULT NULL,
"class_level" varchar(1000) DEFAULT NULL,
"training" INTEGER DEFAULT NULL,
"staff_type" varchar(191) DEFAULT NULL,
"join_date" date DEFAULT NULL,
"first_name" varchar(191) DEFAULT NULL,
"middle_name" varchar(191) DEFAULT NULL,
"last_name" varchar(191) DEFAULT NULL,
"father_name" varchar(191) DEFAULT NULL,
"mother_name" varchar(191) DEFAULT NULL,
"date_of_birth" varchar(191) DEFAULT NULL,
"ntn" varchar(191) DEFAULT NULL,
"conveyance" varchar(191) DEFAULT NULL,
"house_rent" varchar(191) DEFAULT NULL,
"provident_fund" varchar(191) DEFAULT NULL,
"provident_amount" varchar(191) DEFAULT NULL,
"medical_allowances" varchar(191) DEFAULT NULL,
"filer_type" varchar(191) DEFAULT NULL,
"gender" varchar(191) DEFAULT NULL,
"blood_group" varchar(191) DEFAULT NULL,
"nationality" varchar(191) DEFAULT NULL,
"mother_tongue" varchar(191) DEFAULT NULL,
"address" varchar(191) DEFAULT NULL,
"country" varchar(191) DEFAULT NULL,
"city" varchar(191) DEFAULT NULL,
"temp_address" varchar(191) DEFAULT NULL,
"home_phone" varchar(191) DEFAULT NULL,
"mobile_1" varchar(191) DEFAULT NULL,
"mobile_2" varchar(191) DEFAULT NULL,
"email" varchar(100) NOT NULL,
"qualification" varchar(191) DEFAULT NULL,
"experience" varchar(191) DEFAULT NULL,
"other_info" varchar(191) DEFAULT NULL,
"staff_image" varchar(191) DEFAULT NULL,
"skill" varchar(191) DEFAULT NULL,
"salary" varchar(191) DEFAULT NULL,
"salary_per_hour" varchar(191) DEFAULT NULL,
"password" varchar(191) NOT NULL,
"cnic" varchar(100) DEFAULT NULL,
"status" TEXT DEFAULT 'Active',
"sos_date" date DEFAULT NULL,
"sos_reason" varchar(1000) DEFAULT NULL,
"job_status" TEXT DEFAULT NULL,
"start_day_contract" varchar(191) DEFAULT NULL,
"end_day_contract" varchar(191) DEFAULT NULL,
"probation" varchar(191) DEFAULT NULL,
"bank_id" INTEGER DEFAULT NULL,
"is_iban" varchar(1) DEFAULT NULL,
"bank_account" TEXT DEFAULT NULL,
"bank_branch" TEXT DEFAULT NULL,
"account_title" TEXT DEFAULT NULL,
"account_number" varchar(191) DEFAULT NULL,
"basic_salary" INTEGER DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"epf_join_date" date DEFAULT NULL,
"epf" TEXT DEFAULT 'No',
"epf_amount" INTEGER DEFAULT NULL,
"eobi_amount" INTEGER DEFAULT NULL,
"epf_paid" INTEGER DEFAULT NULL,
"eobi_govt_id" INTEGER DEFAULT NULL,
"eobi_join_date" date DEFAULT NULL,
"eobi" TEXT DEFAULT 'No',
"staff_type_id" INTEGER DEFAULT NULL,
"designation" varchar(191) DEFAULT NULL,
"department_id" INTEGER DEFAULT NULL,
"tax_percentage" INTEGER DEFAULT NULL,
"experience_info" varchar(191) DEFAULT NULL,
"remarks" varchar(191) DEFAULT NULL,
"temp_state" varchar(191) DEFAULT NULL,
"temp_country" varchar(191) DEFAULT NULL,
"view_sos_status" INTEGER DEFAULT 0,
"epf_date" date DEFAULT NULL,
"epf_description" varchar(255) DEFAULT NULL,
"epf_opening_amount" INTEGER DEFAULT NULL,
"eobi_opening_amount" INTEGER DEFAULT NULL,
"payment_type" varchar(191) DEFAULT NULL,
"first_registration_code" varchar(250) DEFAULT NULL,
"disability" SMALLINT NOT NULL DEFAULT 0,
"disability_description" varchar(255) DEFAULT NULL,
"ess_status" SMALLINT NOT NULL DEFAULT 0
);


-- --------------------------------------------------------

--
-- Table structure for table `staff_bi_branches`
--

DROP TABLE IF EXISTS "staff_bi_branches" CASCADE;
CREATE TABLE IF NOT EXISTS "staff_bi_branches" (
"id" SERIAL,
"staff_id" varchar(100) DEFAULT NULL,
"branch_id" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `staff_branches`
--

DROP TABLE IF EXISTS "staff_branches" CASCADE;
CREATE TABLE IF NOT EXISTS "staff_branches" (
"id" SERIAL,
"staff_id" varchar(100) DEFAULT NULL,
"branch_id" INTEGER NOT NULL,
"gross_salary_amount" INTEGER DEFAULT 0,
"total_amount_all_branches" INTEGER DEFAULT 0,
"epf_eobi_branch_deduction" INTEGER DEFAULT 0,
"work_shift_id" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `staff_branch_transfer`
--

DROP TABLE IF EXISTS "staff_branch_transfer" CASCADE;
CREATE TABLE IF NOT EXISTS "staff_branch_transfer" (
"id" SERIAL,
"staff_id" INTEGER NOT NULL,
"from_branch" INTEGER NOT NULL,
"to_branch" INTEGER NOT NULL,
"date" date NOT NULL,
"status" varchar(255) NOT NULL,
"reason" TEXT NOT NULL,
"created_by" INTEGER NOT NULL,
"principal_approval" TEXT NOT NULL,
"verified_by" INTEGER NOT NULL,
"verified_status" varchar(255) NOT NULL DEFAULT 'Pending',
"approved_status" varchar(255) NOT NULL DEFAULT 'Pending',
"approved_by" INTEGER NOT NULL,
"updated_at" date NOT NULL,
"created_at" date NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `staff_emergency_contacts`
--

DROP TABLE IF EXISTS "staff_emergency_contacts" CASCADE;
CREATE TABLE IF NOT EXISTS "staff_emergency_contacts" (
"id" SERIAL,
"staff_id" INTEGER DEFAULT NULL,
"staff_bi_id" INTEGER DEFAULT NULL,
"name" varchar(50) NOT NULL,
"relation" varchar(50) NOT NULL,
"phone" varchar(50) NOT NULL,
"email" varchar(50) NOT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `staff_experiences`
--

DROP TABLE IF EXISTS "staff_experiences" CASCADE;
CREATE TABLE IF NOT EXISTS "staff_experiences" (
"id" SERIAL,
"staff_id" INTEGER DEFAULT NULL,
"staff_bi_id" INTEGER DEFAULT NULL,
"name" varchar(50) NOT NULL,
"designation" varchar(50) NOT NULL,
"from_date" date NOT NULL,
"to_date" date NOT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `staff_families`
--

DROP TABLE IF EXISTS "staff_families" CASCADE;
CREATE TABLE IF NOT EXISTS "staff_families" (
"id" SERIAL,
"staff_id" INTEGER DEFAULT NULL,
"staff_bi_id" INTEGER DEFAULT NULL,
"name" varchar(50) NOT NULL,
"relation" varchar(50) NOT NULL,
"phone" varchar(20) NOT NULL,
"gender" varchar(20) NOT NULL,
"cnic" varchar(50) NOT NULL,
"workplace" varchar(255) NOT NULL,
"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `staff_performances`
--

DROP TABLE IF EXISTS "staff_performances" CASCADE;
CREATE TABLE IF NOT EXISTS "staff_performances" (
"id" SERIAL,
"user_id" INTEGER NOT NULL,
"lecture_deliver" varchar(191) NOT NULL,
"confidence" varchar(191) NOT NULL,
"punctuality" varchar(191) NOT NULL,
"moral_values" varchar(191) NOT NULL,
"student_feedback" varchar(191) NOT NULL,
"date" varchar(191) DEFAULT NULL,
"month" varchar(191) DEFAULT NULL,
"status" TEXT NOT NULL DEFAULT 'Active',
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `staff_program_assign`
--

DROP TABLE IF EXISTS "staff_program_assign" CASCADE;
CREATE TABLE IF NOT EXISTS "staff_program_assign" (
"id" SERIAL,
"staff_id" INTEGER NOT NULL,
"program_id" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `staff_qualifications`
--

DROP TABLE IF EXISTS "staff_qualifications" CASCADE;
CREATE TABLE IF NOT EXISTS "staff_qualifications" (
"id" SERIAL,
"staff_id" INTEGER NOT NULL,
"degree" varchar(191) NOT NULL,
"institute" varchar(191) DEFAULT NULL,
"board_or_university" varchar(191) DEFAULT NULL,
"passing_year" INTEGER DEFAULT NULL,
"grade_or_cgpa" varchar(50) DEFAULT NULL,
"attachment" varchar(255) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `staff_student_parents`
--

DROP TABLE IF EXISTS "staff_student_parents" CASCADE;
CREATE TABLE IF NOT EXISTS "staff_student_parents" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"staff_id" INTEGER DEFAULT NULL,
"student_id" INTEGER DEFAULT NULL,
"guardian_id" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `staff_transfer_branches`
--

DROP TABLE IF EXISTS "staff_transfer_branches" CASCADE;
CREATE TABLE IF NOT EXISTS "staff_transfer_branches" (
"id" SERIAL,
"user_id" INTEGER NOT NULL,
"staff_status" TEXT NOT NULL,
"branch_id" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `staff_type`
--

DROP TABLE IF EXISTS "staff_type" CASCADE;
CREATE TABLE IF NOT EXISTS "staff_type" (
"id" SERIAL,
"name" varchar(255) DEFAULT NULL,
"staff_type_code" varchar(255) NOT NULL,
"description" varchar(191) DEFAULT NULL,
"sequence_id" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `std_active_s_elecive`
--

DROP TABLE IF EXISTS "std_active_s_elecive" CASCADE;
CREATE TABLE IF NOT EXISTS "std_active_s_elecive" (
"id" SERIAL,
"active_session_student_id" INTEGER NOT NULL,
"active_session_section_id" INTEGER DEFAULT NULL,
"student_id" INTEGER DEFAULT NULL,
"course_id" INTEGER NOT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"status" INTEGER NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `std_student_guardians`
--

DROP TABLE IF EXISTS "std_student_guardians" CASCADE;
CREATE TABLE IF NOT EXISTS "std_student_guardians" (
"id" SERIAL,
"students_id" INTEGER NOT NULL,
"guardians_id" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS "students" CASCADE;
CREATE TABLE IF NOT EXISTS "students" (
"id" SERIAL,
"reg_no" varchar(191) DEFAULT NULL,
"first_paid_date" date DEFAULT NULL,
"first_due_date" date DEFAULT NULL,
"academics_details" varchar(250) DEFAULT NULL,
"mt_email" varchar(11) DEFAULT NULL,
"walkin_reg_no" varchar(191) DEFAULT NULL,
"transfer_id" varchar(191) DEFAULT NULL,
"admission_status" varchar(191) DEFAULT NULL,
"user_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"academic_group_id" INTEGER DEFAULT NULL,
"class_id" INTEGER DEFAULT NULL,
"intake_id" INTEGER DEFAULT NULL,
"section_id" INTEGER DEFAULT NULL,
"registered_session" INTEGER DEFAULT NULL,
"active_session_id" INTEGER DEFAULT NULL,
"term_id" INTEGER DEFAULT NULL,
"reg_date" varchar(191) DEFAULT NULL,
"previous_school" varchar(191) DEFAULT NULL,
"previous_class" varchar(191) DEFAULT NULL,
"academic_status" varchar(191) DEFAULT NULL,
"first_name" varchar(191) DEFAULT NULL,
"middle_name" varchar(191) DEFAULT NULL,
"last_name" varchar(191) DEFAULT NULL,
"date_of_birth" varchar(191) DEFAULT NULL,
"gender" varchar(191) DEFAULT NULL,
"blood_group" varchar(191) DEFAULT NULL,
"nationality" varchar(191) DEFAULT NULL,
"mother_tongue" varchar(191) DEFAULT NULL,
"email" varchar(191) DEFAULT NULL,
"extra_info" varchar(191) DEFAULT NULL,
"home_phone" varchar(191) DEFAULT NULL,
"mobile_1" varchar(191) DEFAULT NULL,
"mobile_2" varchar(191) DEFAULT NULL,
"state" varchar(191) DEFAULT NULL,
"country" varchar(191) DEFAULT NULL,
"city" varchar(191) DEFAULT NULL,
"address" varchar(191) DEFAULT NULL,
"temp_address" varchar(191) DEFAULT NULL,
"student_image" varchar(191) DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"active_session_section_id" INTEGER DEFAULT NULL,
"university_reg" varchar(191) DEFAULT NULL,
"sos_date" varchar(191) DEFAULT NULL,
"sos_generate_date" date DEFAULT NULL,
"sos_activate_reason" varchar(191) DEFAULT NULL,
"sos_activate_date" varchar(191) DEFAULT NULL,
"sos_comment" varchar(191) DEFAULT NULL,
"proficiency" varchar(191) DEFAULT NULL,
"father_cnic" varchar(191) DEFAULT NULL,
"mother_cnic" varchar(191) DEFAULT NULL,
"language_speak" varchar(191) DEFAULT NULL,
"sos_status" varchar(191) NOT NULL DEFAULT 'Active',
"english_examination" varchar(191) DEFAULT NULL,
"parent_id" INTEGER DEFAULT NULL,
"status" TEXT NOT NULL DEFAULT 'Active',
"staff_ref" varchar(191) DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `student_attendance_payroll`
--

DROP TABLE IF EXISTS "student_attendance_payroll" CASCADE;
CREATE TABLE IF NOT EXISTS "student_attendance_payroll" (
"id" SERIAL,
"active_session_student_id" INTEGER DEFAULT NULL,
"student_id" INTEGER DEFAULT NULL,
"class_date" date DEFAULT NULL,
"class_time" time DEFAULT NULL,
"day" TEXT DEFAULT NULL,
"attendance_type" varchar(191) DEFAULT NULL,
"attendance" varchar(191) DEFAULT NULL,
"attendance_in" varchar(191) DEFAULT NULL,
"attendance_out" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"class_in_time" time DEFAULT NULL,
"class_out_time" time DEFAULT NULL,
"timetable_start_time" time DEFAULT NULL,
"timetable_end_time" time DEFAULT NULL,
"course_id" INTEGER DEFAULT NULL,
"remarks" varchar(191) DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `student_enrollments`
--

DROP TABLE IF EXISTS "student_enrollments" CASCADE;
CREATE TABLE IF NOT EXISTS "student_enrollments" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"board_id" INTEGER NOT NULL,
"student_id" INTEGER NOT NULL,
"session_id" INTEGER NOT NULL,
"program_id" INTEGER NOT NULL,
"term_id" INTEGER NOT NULL,
"section_id" INTEGER NOT NULL,
"subject_id" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `student_enrollments_record`
--

DROP TABLE IF EXISTS "student_enrollments_record" CASCADE;
CREATE TABLE IF NOT EXISTS "student_enrollments_record" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"student_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"term_id" INTEGER DEFAULT NULL,
"section_id" INTEGER DEFAULT NULL,
"subject_id" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `student_fee_settings`
--

DROP TABLE IF EXISTS "student_fee_settings" CASCADE;
CREATE TABLE IF NOT EXISTS "student_fee_settings" (
"id" SERIAL,
"student_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"installment_id" INTEGER DEFAULT NULL,
"basic_fee" varchar(191) DEFAULT NULL,
"discount" varchar(191) DEFAULT NULL,
"status" varchar(191) NOT NULL DEFAULT '1',
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `student_guardians`
--

DROP TABLE IF EXISTS "student_guardians" CASCADE;
CREATE TABLE IF NOT EXISTS "student_guardians" (
"id" SERIAL,
"students_id" INTEGER NOT NULL,
"guardians_id" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `student_reports`
--

DROP TABLE IF EXISTS "student_reports" CASCADE;
CREATE TABLE IF NOT EXISTS "student_reports" (
"id" SERIAL,
"student_id" INTEGER DEFAULT NULL,
"reportgroup_id" INTEGER DEFAULT NULL,
"active_section_id" INTEGER DEFAULT NULL,
"term_id" INTEGER DEFAULT NULL,
"name" varchar(191) DEFAULT NULL,
"grade" DOUBLE PRECISION DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `student_report_details`
--

DROP TABLE IF EXISTS "student_report_details" CASCADE;
CREATE TABLE IF NOT EXISTS "student_report_details" (
"id" SERIAL,
"student_report_id" INTEGER DEFAULT NULL,
"report_parameter" varchar(191) DEFAULT NULL,
"name" varchar(191) DEFAULT NULL,
"marks" DOUBLE PRECISION DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `student_sos_details`
--

DROP TABLE IF EXISTS "student_sos_details" CASCADE;
CREATE TABLE IF NOT EXISTS "student_sos_details" (
"id" SERIAL,
"student_id" INTEGER DEFAULT NULL,
"reason" varchar(191) DEFAULT NULL,
"status" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `student_sos_statuses`
--

DROP TABLE IF EXISTS "student_sos_statuses" CASCADE;
CREATE TABLE IF NOT EXISTS "student_sos_statuses" (
"id" SERIAL,
"student_id" INTEGER DEFAULT NULL,
"admission_status" varchar(191) DEFAULT NULL,
"sos_status" varchar(191) DEFAULT NULL,
"created_at" date DEFAULT NULL,
"month" INTEGER DEFAULT NULL,
"updated_at" date DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"branch_id" INTEGER NOT NULL,
"session_id" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `student_status`
--

DROP TABLE IF EXISTS "student_status" CASCADE;
CREATE TABLE IF NOT EXISTS "student_status" (
"id" SERIAL,
"title" varchar(191) DEFAULT NULL,
"display_name" varchar(191) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `student_statuses`
--

DROP TABLE IF EXISTS "student_statuses" CASCADE;
CREATE TABLE IF NOT EXISTS "student_statuses" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"title" varchar(25) NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `student_transfer_history`
--

DROP TABLE IF EXISTS "student_transfer_history" CASCADE;
CREATE TABLE IF NOT EXISTS "student_transfer_history" (
"id" SERIAL,
"student_id" INTEGER DEFAULT NULL,
"pre_branch" INTEGER DEFAULT NULL,
"new_branch_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"class_id" INTEGER DEFAULT NULL,
"section_id" INTEGER DEFAULT NULL,
"transfered_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `subject_category_models`
--

DROP TABLE IF EXISTS "subject_category_models" CASCADE;
CREATE TABLE IF NOT EXISTS "subject_category_models" (
"id" SERIAL,
"title" varchar(191) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"branch_id" INTEGER DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `subject_details`
--

DROP TABLE IF EXISTS "subject_details" CASCADE;
CREATE TABLE IF NOT EXISTS "subject_details" (
"id" SERIAL,
"program_id" INTEGER DEFAULT NULL,
"term_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"title" varchar(100) DEFAULT NULL,
"code" varchar(15) DEFAULT NULL,
"full_mark_theory" INTEGER DEFAULT NULL,
"pass_mark_theory" INTEGER DEFAULT NULL,
"full_mark_practical" INTEGER DEFAULT NULL,
"pass_mark_practical" INTEGER DEFAULT NULL,
"credit_hour" INTEGER DEFAULT NULL,
"sub_type" varchar(15) DEFAULT NULL,
"class_type" varchar(15) DEFAULT NULL,
"lab" INTEGER DEFAULT 0,
"staff_id" INTEGER DEFAULT NULL,
"description" varchar(100) DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `subject_fee_details`
--

DROP TABLE IF EXISTS "subject_fee_details" CASCADE;
CREATE TABLE IF NOT EXISTS "subject_fee_details" (
"subject_fee_details_id" INTEGER NOT NULL,
"subject_id" INTEGER NOT NULL,
"subject_amount" INTEGER NOT NULL,
"subject_fee_master_id" INTEGER NOT NULL,
"actual_fees" varchar(255) NOT NULL,
"updated_at" date NOT NULL,
"created_at" date NOT NULL,
"session_id" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `subject_fee_master`
--

DROP TABLE IF EXISTS "subject_fee_master" CASCADE;
CREATE TABLE IF NOT EXISTS "subject_fee_master" (
"subject_fee_id" INTEGER NOT NULL,
"student_id" INTEGER NOT NULL,
"total_amount" INTEGER NOT NULL,
"due_date" date NOT NULL,
"created_at" date NOT NULL,
"created_by" INTEGER NOT NULL,
"updated_at" date NOT NULL,
"updated_by" INTEGER NOT NULL,
"total_fee" INTEGER NOT NULL,
"tax_amount" INTEGER NOT NULL,
"bill_no" INTEGER NOT NULL,
"session_id" INTEGER NOT NULL,
"status" varchar(255) NOT NULL,
"paid_amount" varchar(255) NOT NULL,
"paid_date" date NOT NULL,
"bank_ledger_id" INTEGER NOT NULL,
"validity_date" date NOT NULL,
"prepared_by" INTEGER NOT NULL,
"type" INTEGER NOT NULL,
"session_details" varchar(255) NOT NULL,
"branch_id" INTEGER DEFAULT NULL,
"note" varchar(11) DEFAULT NULL,
"cpr_no" varchar(255) DEFAULT NULL,
"cpr_date" date DEFAULT NULL,
"sheet_id" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `subject_type`
--

DROP TABLE IF EXISTS "subject_type" CASCADE;
CREATE TABLE IF NOT EXISTS "subject_type" (
"id" SERIAL,
"name" varchar(191) DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `syllabi`
--

DROP TABLE IF EXISTS "syllabi" CASCADE;
CREATE TABLE IF NOT EXISTS "syllabi" (
"id" SERIAL,
"syllabus_head_id" INTEGER NOT NULL,
"type" TEXT DEFAULT NULL,
"active_session_id" INTEGER NOT NULL,
"branch_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"class_id" INTEGER DEFAULT NULL,
"term_id" INTEGER DEFAULT NULL,
"section_id" INTEGER DEFAULT NULL,
"subject_id" INTEGER DEFAULT NULL,
"category_id" INTEGER DEFAULT NULL,
"start_date" varchar(191) DEFAULT NULL,
"end_date" varchar(11) DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"file" varchar(191) DEFAULT NULL,
"title" varchar(191) DEFAULT NULL,
"status" TEXT DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `syllabus_heads`
--

DROP TABLE IF EXISTS "syllabus_heads" CASCADE;
CREATE TABLE IF NOT EXISTS "syllabus_heads" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"syllabus_head_title" varchar(191) DEFAULT NULL,
"slug" varchar(191) DEFAULT NULL,
"status" varchar(191) DEFAULT '1',
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `TABLE 355`
--

DROP TABLE IF EXISTS "TABLE 355" CASCADE;
CREATE TABLE IF NOT EXISTS "TABLE 355" (
"COL 1" INTEGER DEFAULT NULL,
"COL 2" INTEGER DEFAULT NULL,
"COL 3" varchar(54) DEFAULT NULL,
"COL 4" varchar(16) DEFAULT NULL,
"COL 5" INTEGER DEFAULT NULL,
"COL 6" INTEGER DEFAULT NULL,
"COL 7" INTEGER DEFAULT NULL,
"COL 8" varchar(29) DEFAULT NULL,
"COL 9" varchar(13) DEFAULT NULL,
"COL 10" varchar(16) DEFAULT NULL,
"COL 11" varchar(16) DEFAULT NULL,
"COL 12" varchar(6) DEFAULT NULL,
"COL 13" varchar(10) DEFAULT NULL,
"COL 14" varchar(10) DEFAULT NULL,
"COL 15" varchar(10) DEFAULT NULL,
"COL 16" varchar(25) DEFAULT NULL,
"COL 17" varchar(25) DEFAULT NULL,
"COL 18" varchar(10) DEFAULT NULL,
"COL 19" varchar(1) DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `tax_managements`
--

DROP TABLE IF EXISTS "tax_managements" CASCADE;
CREATE TABLE IF NOT EXISTS "tax_managements" (
"id" SERIAL,
"session_id" INTEGER NOT NULL,
"branch_id" INTEGER NOT NULL,
"name" varchar(191) DEFAULT NULL,
"fee_amount" DOUBLE PRECISION NOT NULL,
"amount" DOUBLE PRECISION NOT NULL,
"filer" INTEGER NOT NULL,
"status" INTEGER DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `tbl_attendance_date`
--

DROP TABLE IF EXISTS "tbl_attendance_date" CASCADE;
CREATE TABLE IF NOT EXISTS "tbl_attendance_date" (
"ad_id" INTEGER NOT NULL,
"date" date NOT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `teacher_attendance_payroll`
--

DROP TABLE IF EXISTS "teacher_attendance_payroll" CASCADE;
CREATE TABLE IF NOT EXISTS "teacher_attendance_payroll" (
"id" SERIAL,
"class_in_time" time DEFAULT NULL,
"class_out_time" time DEFAULT NULL,
"timetable_start_time" time DEFAULT NULL,
"timetable_end_time" time DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"active_session_teacher_id" INTEGER DEFAULT NULL,
"staff_id" INTEGER DEFAULT NULL,
"class_Date" date DEFAULT NULL,
"class_time" time DEFAULT NULL,
"current_time" time DEFAULT NULL,
"day" TEXT DEFAULT NULL,
"month" varchar(191) DEFAULT NULL,
"year" INTEGER DEFAULT NULL,
"attendance" INTEGER DEFAULT NULL,
"attendance_type" varchar(191) DEFAULT NULL,
"course_id" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"class_timetable_id" INTEGER DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 0,
"sr_coor_approval_status" SMALLINT NOT NULL DEFAULT 0,
"sr_coor_remarks" varchar(191) DEFAULT NULL,
"sr_coor_approv_in_time" time DEFAULT NULL,
"sr_coor_approv_out_time" time DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `teacher_classes`
--

DROP TABLE IF EXISTS "teacher_classes" CASCADE;
CREATE TABLE IF NOT EXISTS "teacher_classes" (
"id" SERIAL,
"user_id" INTEGER NOT NULL,
"class_id" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `teacher_student_relation`
--

DROP TABLE IF EXISTS "teacher_student_relation" CASCADE;
CREATE TABLE IF NOT EXISTS "teacher_student_relation" (
"id" SERIAL,
"teacher_id" INTEGER DEFAULT NULL,
"student_id" INTEGER DEFAULT NULL,
"section_id" INTEGER DEFAULT NULL,
"active_session_section_id" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `terminations`
--

DROP TABLE IF EXISTS "terminations" CASCADE;
CREATE TABLE IF NOT EXISTS "terminations" (
"id" SERIAL,
"user_id" INTEGER NOT NULL,
"reason" varchar(191) NOT NULL,
"warnings" TEXT NOT NULL,
"acknowledge" TEXT NOT NULL DEFAULT 'no',
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `terms`
--

DROP TABLE IF EXISTS "terms" CASCADE;
CREATE TABLE IF NOT EXISTS "terms" (
"id" SERIAL,
"academic_year_id" INTEGER DEFAULT NULL,
"name" varchar(191) DEFAULT NULL,
"start_month" varchar(191) DEFAULT NULL,
"start_year" varchar(191) DEFAULT NULL,
"end_month" varchar(191) DEFAULT NULL,
"end_year" varchar(191) DEFAULT NULL,
"status" TEXT NOT NULL DEFAULT 'Active',
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"deleted_by" INTEGER DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"description" varchar(191) DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `tier`
--

DROP TABLE IF EXISTS "tier" CASCADE;
CREATE TABLE IF NOT EXISTS "tier" (
"id" SERIAL,
"name" varchar(191) DEFAULT NULL,
"deleted_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `timetable_categories`
--

DROP TABLE IF EXISTS "timetable_categories" CASCADE;
CREATE TABLE IF NOT EXISTS "timetable_categories" (
"id" SERIAL,
"name" varchar(191) NOT NULL,
"description" varchar(191) NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `time_tables`
--

DROP TABLE IF EXISTS "time_tables" CASCADE;
CREATE TABLE IF NOT EXISTS "time_tables" (
"id" SERIAL,
"time_table_slot_id" INTEGER NOT NULL,
"title" varchar(191) NOT NULL,
"branch_id" INTEGER DEFAULT NULL,
"program_id" INTEGER NOT NULL,
"timetable_category_id" INTEGER DEFAULT NULL,
"start_date" varchar(191) DEFAULT NULL,
"end_date" varchar(191) DEFAULT NULL,
"start_time" varchar(191) DEFAULT NULL,
"end_time" varchar(191) DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"subject_id" INTEGER NOT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `time_table_slots`
--

DROP TABLE IF EXISTS "time_table_slots" CASCADE;
CREATE TABLE IF NOT EXISTS "time_table_slots" (
"id" SERIAL,
"name" varchar(191) DEFAULT NULL,
"slot_to" time DEFAULT NULL,
"slot_from" time DEFAULT NULL,
"to_date" date DEFAULT NULL,
"from_date" date DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"board_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"class_id" INTEGER DEFAULT NULL,
"intake_id" INTEGER DEFAULT NULL,
"section_id" INTEGER DEFAULT NULL,
"status" INTEGER NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `todos`
--

DROP TABLE IF EXISTS "todos" CASCADE;
CREATE TABLE IF NOT EXISTS "todos" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"task" TEXT DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `trainees`
--

DROP TABLE IF EXISTS "trainees" CASCADE;
CREATE TABLE IF NOT EXISTS "trainees" (
"id" SERIAL,
"staff_id" BIGINT NOT NULL,
"training_id" INTEGER NOT NULL,
"avalibility" SMALLINT NOT NULL,
"remarks" varchar(191) DEFAULT NULL,
"acknowledge" SMALLINT NOT NULL DEFAULT 0,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `trainings`
--

DROP TABLE IF EXISTS "trainings" CASCADE;
CREATE TABLE IF NOT EXISTS "trainings" (
"id" SERIAL,
"venue" varchar(191) NOT NULL,
"category" TEXT NOT NULL,
"department" varchar(191) DEFAULT NULL,
"designation" varchar(191) DEFAULT NULL,
"branch_id" BIGINT DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"date" date NOT NULL,
"time" varchar(191) NOT NULL,
"training_by" varchar(191) DEFAULT NULL,
"no_of_days" BIGINT DEFAULT NULL,
"training_charges" varchar(191) DEFAULT NULL,
"training_type" varchar(191) NOT NULL,
"created_by" INTEGER NOT NULL,
"updated_by" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS "transactions" CASCADE;
CREATE TABLE IF NOT EXISTS "transactions" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"tr_head_id" INTEGER NOT NULL,
"date" TIMESTAMP NOT NULL,
"dr_amount" INTEGER DEFAULT NULL,
"cr_amount" INTEGER DEFAULT NULL,
"description" TEXT DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `transaction_heads`
--

DROP TABLE IF EXISTS "transaction_heads" CASCADE;
CREATE TABLE IF NOT EXISTS "transaction_heads" (
"id" SERIAL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"tr_head" varchar(100) NOT NULL,
"type" varchar(10) NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `transfer_state_management`
--

DROP TABLE IF EXISTS "transfer_state_management" CASCADE;
CREATE TABLE IF NOT EXISTS "transfer_state_management" (
"id" SERIAL,
"transfer_id" INTEGER NOT NULL,
"status" varchar(255) NOT NULL,
"transfer_status" varchar(255) NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `transfer_student_detail`
--

DROP TABLE IF EXISTS "transfer_student_detail" CASCADE;
CREATE TABLE IF NOT EXISTS "transfer_student_detail" (
"id" SERIAL,
"student_id" INTEGER NOT NULL,
"student_enrollment_id" INTEGER NOT NULL,
"branch_from" INTEGER NOT NULL,
"branch_to" INTEGER NOT NULL,
"branch_to_board" INTEGER DEFAULT NULL,
"branch_to_program" INTEGER DEFAULT NULL,
"branch_to_class" INTEGER DEFAULT NULL,
"branch_to_intake" INTEGER DEFAULT NULL,
"old_reg_no" varchar(191) DEFAULT NULL,
"status" varchar(255) NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `unit_planner`
--

DROP TABLE IF EXISTS "unit_planner" CASCADE;
CREATE TABLE IF NOT EXISTS "unit_planner" (
"id" SERIAL,
"title" varchar(191) DEFAULT NULL,
"curriculum_id" INTEGER NOT NULL,
"date" date DEFAULT NULL,
"file" varchar(191) DEFAULT NULL,
"description" varchar(191) DEFAULT NULL,
"status" TEXT DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER DEFAULT NULL,
"last_updated_by" INTEGER DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `unit_planner_details`
--

DROP TABLE IF EXISTS "unit_planner_details" CASCADE;
CREATE TABLE IF NOT EXISTS "unit_planner_details" (
"id" SERIAL,
"unit_planner_id" INTEGER DEFAULT NULL,
"curriculum_detail_id" INTEGER NOT NULL,
"week1" varchar(191) DEFAULT NULL,
"week2" varchar(191) DEFAULT NULL,
"week3" varchar(191) DEFAULT NULL,
"week4" varchar(191) DEFAULT NULL,
"week5" TEXT DEFAULT NULL,
"week1_file" varchar(255) DEFAULT NULL,
"week2_file" varchar(255) DEFAULT NULL,
"week3_file" varchar(255) DEFAULT NULL,
"week4_file" varchar(255) DEFAULT NULL,
"week5_file" varchar(255) DEFAULT NULL,
"summary1" varchar(255) DEFAULT NULL,
"summary2" varchar(255) DEFAULT NULL,
"summary3" varchar(255) DEFAULT NULL,
"summary4" varchar(255) DEFAULT NULL,
"summary5" varchar(255) DEFAULT NULL,
"status" SMALLINT DEFAULT 1,
"created_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `uom`
--

DROP TABLE IF EXISTS "uom" CASCADE;
CREATE TABLE IF NOT EXISTS "uom" (
"id" SERIAL,
"name" varchar(191) NOT NULL,
"description" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `uploaded_documents`
--

DROP TABLE IF EXISTS "uploaded_documents" CASCADE;
CREATE TABLE IF NOT EXISTS "uploaded_documents" (
"id" SERIAL,
"group_event_id" INTEGER NOT NULL,
"files_path" varchar(191) NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `upload_experience_letters`
--

DROP TABLE IF EXISTS "upload_experience_letters" CASCADE;
CREATE TABLE IF NOT EXISTS "upload_experience_letters" (
"id" SERIAL,
"user_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"name" varchar(191) NOT NULL,
"reg_no" varchar(191) NOT NULL,
"file" varchar(191) DEFAULT NULL,
"designation" varchar(191) DEFAULT NULL,
"branch_name" varchar(191) NOT NULL,
"class" varchar(191) DEFAULT NULL,
"subject" varchar(191) DEFAULT NULL,
"home_address" varchar(191) NOT NULL,
"contact" varchar(191) NOT NULL,
"join_date" date DEFAULT NULL,
"last_day_of_work" varchar(191) NOT NULL,
"experiene_letter_file" varchar(100) DEFAULT NULL,
"clearance_file" varchar(100) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS "user" CASCADE;
CREATE TABLE IF NOT EXISTS "user" (
"id" BIGINT NOT NULL,
"name" varchar(255) NOT NULL,
"email" varchar(255) NOT NULL,
"email_verified_at" TIMESTAMP DEFAULT NULL,
"password" varchar(255) NOT NULL,
"remember_token" varchar(100) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS "users" CASCADE;
CREATE TABLE IF NOT EXISTS "users" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"role_id" INTEGER DEFAULT NULL,
"hook_id" INTEGER DEFAULT NULL,
"name" varchar(191) NOT NULL,
"email" varchar(191) NOT NULL,
"password" varchar(191) NOT NULL,
"api_token" varchar(255) DEFAULT NULL,
"user_type" varchar(255) DEFAULT NULL,
"remember_token" varchar(191) DEFAULT NULL,
"last_login_at" varchar(191) DEFAULT NULL,
"last_login_ip" varchar(191) DEFAULT NULL,
"lockout_time" varchar(191) DEFAULT NULL,
"active" SMALLINT NOT NULL DEFAULT 0,
"reason" varchar(1000) NOT NULL,
"status" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"string_password" varchar(191) DEFAULT NULL,
"board_id_one" INTEGER NOT NULL DEFAULT 0,
"board_id_two" INTEGER NOT NULL DEFAULT 0,
"program_id_one" INTEGER NOT NULL DEFAULT 0,
"program_id_two" INTEGER NOT NULL DEFAULT 0
);


-- --------------------------------------------------------

--
-- Table structure for table `user_pemissions`
--

DROP TABLE IF EXISTS "user_pemissions" CASCADE;
CREATE TABLE IF NOT EXISTS "user_pemissions" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"staffs" INTEGER NOT NULL,
"programs" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `utilitybills`
--

DROP TABLE IF EXISTS "utilitybills" CASCADE;
CREATE TABLE IF NOT EXISTS "utilitybills" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"month" varchar(255) NOT NULL,
"meter_no" varchar(255) NOT NULL,
"nature" varchar(255) NOT NULL,
"bill_amoun" varchar(255) NOT NULL,
"with_holding_tax" varchar(255) NOT NULL,
"total_bill" varchar(255) NOT NULL,
"last_month_bill" varchar(255) NOT NULL,
"increase_decease_bill" varchar(255) NOT NULL,
"reason" varchar(255) NOT NULL,
"status" varchar(255) NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `walk_in_registration`
--

DROP TABLE IF EXISTS "walk_in_registration" CASCADE;
CREATE TABLE IF NOT EXISTS "walk_in_registration" (
"id" SERIAL,
"branch_id" INTEGER NOT NULL,
"student_first_name" varchar(191) DEFAULT NULL,
"student_middle_name" varchar(191) DEFAULT NULL,
"student_last_name" varchar(191) DEFAULT NULL,
"parent_first_name" varchar(191) DEFAULT NULL,
"parent_middle_name" varchar(191) DEFAULT NULL,
"parent_last_name" varchar(191) DEFAULT NULL,
"contact_number" varchar(191) DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"reg_date" date DEFAULT NULL,
"cnic" TEXT DEFAULT NULL,
"reference" TEXT DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `weekdays`
--

DROP TABLE IF EXISTS "weekdays" CASCADE;
CREATE TABLE IF NOT EXISTS "weekdays" (
"id" SERIAL,
"name" varchar(191) DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `work_plans`
--

DROP TABLE IF EXISTS "work_plans" CASCADE;
CREATE TABLE IF NOT EXISTS "work_plans" (
"id" SERIAL,
"branch_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"program_id" INTEGER DEFAULT NULL,
"term_id" INTEGER DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `work_plan_details`
--

DROP TABLE IF EXISTS "work_plan_details" CASCADE;
CREATE TABLE IF NOT EXISTS "work_plan_details" (
"id" SERIAL,
"workplan_id" INTEGER DEFAULT NULL,
"session_id" INTEGER DEFAULT NULL,
"branch_id" INTEGER DEFAULT NULL,
"subject_id" INTEGER DEFAULT NULL,
"teacher_id" INTEGER DEFAULT NULL,
"file" varchar(191) DEFAULT NULL,
"description" TEXT DEFAULT NULL,
"status" SMALLINT NOT NULL DEFAULT 1,
"start_date" date DEFAULT NULL,
"end_date" date DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


-- --------------------------------------------------------

--
-- Table structure for table `years`
--

DROP TABLE IF EXISTS "years" CASCADE;
CREATE TABLE IF NOT EXISTS "years" (
"id" INTEGER NOT NULL,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL,
"created_by" INTEGER NOT NULL,
"last_updated_by" INTEGER DEFAULT NULL,
"title" varchar(4) NOT NULL,
"active_status" SMALLINT NOT NULL DEFAULT 0,
"status" SMALLINT NOT NULL DEFAULT 1
);


-- --------------------------------------------------------

--
-- Table structure for table `zkteco_devices`
--

DROP TABLE IF EXISTS "zkteco_devices" CASCADE;
CREATE TABLE IF NOT EXISTS "zkteco_devices" (
"id" BIGINT NOT NULL,
"ip" varchar(45) NOT NULL,
"port" varchar(10) NOT NULL,
"model_name" varchar(255) NOT NULL,
"status" SMALLINT NOT NULL DEFAULT 0,
"created_at" TIMESTAMP DEFAULT NULL,
"updated_at" TIMESTAMP DEFAULT NULL
);


--
-- Indexes for dumped tables
--

--
-- Indexes for table `academics_groups`
--
ALTER TABLE "academics_groups" ADD PRIMARY KEY ("id");
CREATE INDEX "academics_groups_program_id_foreign" ON "academics_groups" ("program_id");

--
-- Indexes for table `academics_group_courses`
--
ALTER TABLE "academics_group_courses" ADD PRIMARY KEY ("id");
CREATE INDEX "academics_group_courses_academics_group_id_foreign" ON "academics_group_courses" ("academics_group_id");
CREATE INDEX "academics_group_courses_course_id_foreign" ON "academics_group_courses" ("course_id");

--
-- Indexes for table `academic_infos`
--
ALTER TABLE "academic_infos" ADD PRIMARY KEY ("id");

--
-- Indexes for table `accumulative_report`
--
ALTER TABLE "accumulative_report" ADD PRIMARY KEY ("id");

--
-- Indexes for table `accumulative_report_details`
--
ALTER TABLE "accumulative_report_details" ADD PRIMARY KEY ("id");

--
-- Indexes for table `active_sessions`
--
ALTER TABLE "active_sessions" ADD PRIMARY KEY ("id");
CREATE INDEX "active_sessions_session_id_foreign" ON "active_sessions" ("session_id");
CREATE INDEX "active_sessions_board_id_foreign" ON "active_sessions" ("board_id");
CREATE INDEX "active_sessions_branch_id_foreign" ON "active_sessions" ("branch_id");
CREATE INDEX "active_sessions_program_id_foreign" ON "active_sessions" ("program_id");
CREATE INDEX "active_sessions_class_id_foreign" ON "active_sessions" ("class_id");
CREATE INDEX "idx_active_sessions_session_branch" ON "active_sessions" ("session_id", "branch_id");
CREATE INDEX "idx_active_sessions_board_program" ON "active_sessions" ("board_id", "program_id");
CREATE INDEX "idx_active_sessions_class_intake" ON "active_sessions" ("class_id", "intake_id");

--
-- Indexes for table `active_session_sections`
--
ALTER TABLE "active_session_sections" ADD PRIMARY KEY ("id");
CREATE INDEX "active_session_sections_active_session_id_foreign" ON "active_session_sections" ("active_session_id");
CREATE INDEX "active_session_sections_section_id_foreign" ON "active_session_sections" ("section_id");
CREATE INDEX "idx_active_session_sections_session_section" ON "active_session_sections" ("active_session_id", "section_id");

--
-- Indexes for table `active_session_students`
--
ALTER TABLE "active_session_students" ADD PRIMARY KEY ("id");
CREATE INDEX "active_session_students_active_session_section_id_foreign" ON "active_session_students" ("active_session_section_id");
CREATE INDEX "active_session_students_student_id_foreign" ON "active_session_students" ("student_id");
CREATE INDEX "active_session_students_academics_group_id_foreign" ON "active_session_students" ("academics_group_id");
CREATE INDEX "idx_active_session_students_student_status" ON "active_session_students" ("student_id", "status");
CREATE INDEX "idx_active_session_students_section_status" ON "active_session_students" ("active_session_section_id", "status");

--
-- Indexes for table `active_session_teachers`
--
ALTER TABLE "active_session_teachers" ADD PRIMARY KEY ("id");

--
-- Indexes for table `addressinfos`
--
ALTER TABLE "addressinfos" ADD PRIMARY KEY ("id");

--
-- Indexes for table `add_goods_branch`
--
ALTER TABLE "add_goods_branch" ADD PRIMARY KEY ("id");

--
-- Indexes for table `agendas`
--
ALTER TABLE "agendas" ADD PRIMARY KEY ("id");

--
-- Indexes for table `alert_settings`
--
ALTER TABLE "alert_settings" ADD PRIMARY KEY ("id");

--
-- Indexes for table `annual_calendars`
--
ALTER TABLE "annual_calendars" ADD PRIMARY KEY ("id");

--
-- Indexes for table `api_authentication_user`
--
ALTER TABLE "api_authentication_user" ADD PRIMARY KEY ("id");

--
-- Indexes for table `api_payment_transaction`
--
ALTER TABLE "api_payment_transaction" ADD PRIMARY KEY ("id");

--
-- Indexes for table `approve_agendas`
--
ALTER TABLE "approve_agendas" ADD PRIMARY KEY ("id");
CREATE INDEX "approve_agendas_agenda_request_id_foreign" ON "approve_agendas" ("agenda_request_id");

--
-- Indexes for table `assesment_types`
--
ALTER TABLE "assesment_types" ADD PRIMARY KEY ("id");

--
-- Indexes for table `assessments`
--
ALTER TABLE "assessments" ADD PRIMARY KEY ("id");

--
-- Indexes for table `assets`
--
ALTER TABLE "assets" ADD PRIMARY KEY ("id");

--
-- Indexes for table `assets_quantity`
--
ALTER TABLE "assets_quantity" ADD PRIMARY KEY ("id");

--
-- Indexes for table `assets_type`
--
ALTER TABLE "assets_type" ADD PRIMARY KEY ("id");

--
-- Indexes for table `assignments`
--
ALTER TABLE "assignments" ADD PRIMARY KEY ("id");

--
-- Indexes for table `assignment_answers`
--
ALTER TABLE "assignment_answers" ADD PRIMARY KEY ("id");

--
-- Indexes for table `assign_active_session_course_lab`
--
ALTER TABLE "assign_active_session_course_lab" ADD PRIMARY KEY ("id");
CREATE INDEX "assign_active_session_course_lab_active_session_id_foreign" ON "assign_active_session_course_lab" ("active_session_id");
CREATE INDEX "assign_active_session_course_lab_course_id_foreign" ON "assign_active_session_course_lab" ("course_id");
CREATE INDEX "assign_active_session_course_lab_lab_id_foreign" ON "assign_active_session_course_lab" ("lab_id");
CREATE INDEX "assign_active_session_course_lab_created_by_foreign" ON "assign_active_session_course_lab" ("created_by");
CREATE INDEX "assign_active_session_course_lab_updated_by_foreign" ON "assign_active_session_course_lab" ("updated_by");
CREATE INDEX "assign_active_session_course_lab_deleted_by_foreign" ON "assign_active_session_course_lab" ("deleted_by");

--
-- Indexes for table `assign_class_section`
--
ALTER TABLE "assign_class_section" ADD PRIMARY KEY ("id");
CREATE INDEX "assign_class_section_board_program_class_id_foreign" ON "assign_class_section" ("board_program_class_id");
CREATE INDEX "assign_class_section_section_id_foreign" ON "assign_class_section" ("section_id");

--
-- Indexes for table `assingment_student_data`
--
ALTER TABLE "assingment_student_data" ADD PRIMARY KEY ("id");

--
-- Indexes for table `attendances`
--
ALTER TABLE "attendances" ADD PRIMARY KEY ("id");
CREATE INDEX "attendances_session_id_foreign" ON "attendances" ("session_id");
CREATE INDEX "attendances_branch_id_foreign" ON "attendances" ("branch_id");

--
-- Indexes for table `attendance_masters`
--
ALTER TABLE "attendance_masters" ADD PRIMARY KEY ("id");

--
-- Indexes for table `attendance_statuses`
--
ALTER TABLE "attendance_statuses" ADD PRIMARY KEY ("id");

--
-- Indexes for table `attendance_summary`
--
ALTER TABLE "attendance_summary" ADD PRIMARY KEY ("id");

--
-- Indexes for table `attendance__payrolls`
--
ALTER TABLE "attendance__payrolls" ADD PRIMARY KEY ("id");

--
-- Indexes for table `bank_account_request`
--
ALTER TABLE "bank_account_request" ADD PRIMARY KEY ("id");

--
-- Indexes for table `boards`
--
ALTER TABLE "boards" ADD PRIMARY KEY ("id");
CREATE INDEX "boards_created_by_foreign" ON "boards" ("created_by");
CREATE INDEX "boards_updated_by_foreign" ON "boards" ("updated_by");
CREATE INDEX "boards_deleted_by_foreign" ON "boards" ("deleted_by");

--
-- Indexes for table `board_programs`
--
ALTER TABLE "board_programs" ADD PRIMARY KEY ("id");
CREATE INDEX "board_programs_board_id_foreign" ON "board_programs" ("board_id");
CREATE INDEX "board_programs_program_id_foreign" ON "board_programs" ("program_id");

--
-- Indexes for table `books`
--
ALTER TABLE "books" ADD PRIMARY KEY ("id");

--
-- Indexes for table `book_categories`
--
ALTER TABLE "book_categories" ADD PRIMARY KEY ("id");

--
-- Indexes for table `book_issues`
--
ALTER TABLE "book_issues" ADD PRIMARY KEY ("id");

--
-- Indexes for table `book_masters`
--
ALTER TABLE "book_masters" ADD PRIMARY KEY ("id");

--
-- Indexes for table `book_status`
--
ALTER TABLE "book_status" ADD PRIMARY KEY ("id");

--
-- Indexes for table `book_statuses`
--
ALTER TABLE "book_statuses" ADD PRIMARY KEY ("id");

--
-- Indexes for table `bpc_term`
--
ALTER TABLE "bpc_term" ADD PRIMARY KEY ("id");

--
-- Indexes for table `branch_board_program`
--
ALTER TABLE "branch_board_program" ADD PRIMARY KEY ("id");
CREATE INDEX "branch_board_program_branch_id_foreign" ON "branch_board_program" ("branch_id");
CREATE INDEX "branch_board_program_board_id_foreign" ON "branch_board_program" ("board_id");
CREATE INDEX "branch_board_program_program_id_foreign" ON "branch_board_program" ("program_id");

--
-- Indexes for table `branch_departments`
--
ALTER TABLE "branch_departments" ADD PRIMARY KEY ("id");

--
-- Indexes for table `brand`
--
ALTER TABLE "brand" ADD PRIMARY KEY ("id");

--
-- Indexes for table `buildings`
--
ALTER TABLE "buildings" ADD PRIMARY KEY ("id");
CREATE INDEX "buildings_created_by_foreign" ON "buildings" ("created_by");
CREATE INDEX "buildings_updated_by_foreign" ON "buildings" ("updated_by");
CREATE INDEX "buildings_deleted_by_foreign" ON "buildings" ("deleted_by");

--
-- Indexes for table `candidate_form`
--
ALTER TABLE "candidate_form" ADD PRIMARY KEY ("id");
CREATE INDEX "candidate_form_job_post_id_foreign" ON "candidate_form" ("job_post_id");
CREATE INDEX "candidate_form_created_by_foreign" ON "candidate_form" ("created_by");
CREATE INDEX "candidate_form_updated_by_foreign" ON "candidate_form" ("updated_by");
CREATE INDEX "candidate_form_deleted_by_foreign" ON "candidate_form" ("deleted_by");

--
-- Indexes for table `category`
--
ALTER TABLE "category" ADD PRIMARY KEY ("id");

--
-- Indexes for table `child_benefit_configs`
--
ALTER TABLE "child_benefit_configs" ADD PRIMARY KEY ("id");

--
-- Indexes for table `child_benefit_fee_heads_discount`
--
ALTER TABLE "child_benefit_fee_heads_discount" ADD PRIMARY KEY ("id");

--
-- Indexes for table `child_benefit_management`
--
ALTER TABLE "child_benefit_management" ADD PRIMARY KEY ("id");

--
-- Indexes for table `child_benefit_students`
--
ALTER TABLE "child_benefit_students" ADD PRIMARY KEY ("id");
CREATE INDEX "child_benefit_students_staff_id_foreign" ON "child_benefit_students" ("staff_id");
CREATE INDEX "child_benefit_students_student_id_foreign" ON "child_benefit_students" ("student_id");
CREATE INDEX "child_benefit_students_child_benefit_config_id_foreign" ON "child_benefit_students" ("child_benefit_config_id");

--
-- Indexes for table `classes`
--
ALTER TABLE "classes" ADD PRIMARY KEY ("id");
CREATE INDEX "classes_created_by_foreign" ON "classes" ("created_by");
CREATE INDEX "classes_updated_by_foreign" ON "classes" ("updated_by");
CREATE INDEX "classes_deleted_by_foreign" ON "classes" ("deleted_by");

--
-- Indexes for table `class_notice`
--
ALTER TABLE "class_notice" ADD PRIMARY KEY ("id");

--
-- Indexes for table `class_time_tables`
--
ALTER TABLE "class_time_tables" ADD PRIMARY KEY ("id");

--
-- Indexes for table `comments`
--
ALTER TABLE "comments" ADD PRIMARY KEY ("id");

--
-- Indexes for table `compulsory_courses`
--
ALTER TABLE "compulsory_courses" ADD PRIMARY KEY ("id");
CREATE INDEX "compulsory_courses_program_id_foreign" ON "compulsory_courses" ("program_id");
CREATE INDEX "compulsory_courses_course_id_foreign" ON "compulsory_courses" ("course_id");

--
-- Indexes for table `corrections`
--
ALTER TABLE "corrections" ADD PRIMARY KEY ("id");

--
-- Indexes for table `correction_details`
--
ALTER TABLE "correction_details" ADD PRIMARY KEY ("id");

--
-- Indexes for table `courses`
--
ALTER TABLE "courses" ADD PRIMARY KEY ("id");

--
-- Indexes for table `course_types`
--
ALTER TABLE "course_types" ADD PRIMARY KEY ("id");

--
-- Indexes for table `curriculum`
--
ALTER TABLE "curriculum" ADD PRIMARY KEY ("id");

--
-- Indexes for table `curriculum_details`
--
ALTER TABLE "curriculum_details" ADD PRIMARY KEY ("id");

--
-- Indexes for table `date_sheet`
--
ALTER TABLE "date_sheet" ADD PRIMARY KEY ("id");

--
-- Indexes for table `days`
--
ALTER TABLE "days" ADD PRIMARY KEY ("id");

--
-- Indexes for table `departments`
--
ALTER TABLE "departments" ADD PRIMARY KEY ("id");

--
-- Indexes for table `designation`
--
ALTER TABLE "designation" ADD PRIMARY KEY ("id");

--
-- Indexes for table `devices`
--
ALTER TABLE "devices" ADD PRIMARY KEY ("id");

--
-- Indexes for table `diary`
--
ALTER TABLE "diary" ADD PRIMARY KEY ("id");

--
-- Indexes for table `discount_types`
--
ALTER TABLE "discount_types" ADD PRIMARY KEY ("id");
CREATE INDEX "discount_types_created_by_foreign" ON "discount_types" ("created_by");
CREATE INDEX "discount_types_updated_by_foreign" ON "discount_types" ("updated_by");
CREATE INDEX "discount_types_deleted_by_foreign" ON "discount_types" ("deleted_by");

--
-- Indexes for table `documents`
--
ALTER TABLE "documents" ADD PRIMARY KEY ("id");
CREATE INDEX "documents_branch_id_foreign" ON "documents" ("branch_id");
CREATE INDEX "documents_member_id_foreign" ON "documents" ("staff_id");
CREATE INDEX "documents_created_by_foreign" ON "documents" ("created_by");
CREATE INDEX "documents_updated_by_foreign" ON "documents" ("updated_by");
CREATE INDEX "documents_deleted_by_foreign" ON "documents" ("deleted_by");

--
-- Indexes for table `downloads`
--
ALTER TABLE "downloads" ADD PRIMARY KEY ("id");

--
-- Indexes for table `ec_timetables`
--
ALTER TABLE "ec_timetables" ADD PRIMARY KEY ("id");

--
-- Indexes for table `email_settings`
--
ALTER TABLE "email_settings" ADD PRIMARY KEY ("id");

--
-- Indexes for table `employee_attendance`
--
ALTER TABLE "employee_attendance" ADD PRIMARY KEY ("id");

--
-- Indexes for table `entry_types`
--
ALTER TABLE "entry_types" ADD PRIMARY KEY ("id");

--
-- Indexes for table `eobi_epf_register`
--
ALTER TABLE "eobi_epf_register" ADD PRIMARY KEY ("id");

--
-- Indexes for table `eobi_notifications`
--
ALTER TABLE "eobi_notifications" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_academic_year`
--
ALTER TABLE "erp_academic_year" ADD PRIMARY KEY ("id");
CREATE INDEX "erp_academic_year_session_id_foreign" ON "erp_academic_year" ("session_id");

--
-- Indexes for table `erp_account_types`
--
ALTER TABLE "erp_account_types" ADD PRIMARY KEY ("id");
CREATE INDEX "erp_account_types_created_by_foreign" ON "erp_account_types" ("created_by");
CREATE INDEX "erp_account_types_updated_by_foreign" ON "erp_account_types" ("updated_by");
CREATE INDEX "erp_account_types_deleted_by_foreign" ON "erp_account_types" ("deleted_by");

--
-- Indexes for table `erp_attendances`
--
ALTER TABLE "erp_attendances" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_attendance_logs`
--
ALTER TABLE "erp_attendance_logs" ADD PRIMARY KEY ("log_id");

--
-- Indexes for table `erp_attendance_masters`
--
ALTER TABLE "erp_attendance_masters" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_attendance_statuses`
--
ALTER TABLE "erp_attendance_statuses" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_bankdetail`
--
ALTER TABLE "erp_bankdetail" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_banks`
--
ALTER TABLE "erp_banks" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_bank_loan`
--
ALTER TABLE "erp_bank_loan" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_bank_reconcilation`
--
ALTER TABLE "erp_bank_reconcilation" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_branches`
--
ALTER TABLE "erp_branches" ADD PRIMARY KEY ("id");
CREATE INDEX "erp_branches_created_by_foreign" ON "erp_branches" ("created_by");
CREATE INDEX "erp_branches_updated_by_foreign" ON "erp_branches" ("updated_by");
CREATE INDEX "erp_branches_deleted_by_foreign" ON "erp_branches" ("deleted_by");
CREATE INDEX "erp_branches_company_id_foreign" ON "erp_branches" ("company_id");
CREATE INDEX "erp_branches_city_id_foreign" ON "erp_branches" ("city_id");
CREATE INDEX "erp_branches_country_id_foreign" ON "erp_branches" ("country_id");
CREATE INDEX "idx_erp_branches_company_city" ON "erp_branches" ("company_id", "city_id");

--
-- Indexes for table `erp_buildings`
--
ALTER TABLE "erp_buildings" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_candidate_score`
--
ALTER TABLE "erp_candidate_score" ADD PRIMARY KEY ("id");
CREATE INDEX "erp_candidate_score_candidate_form_id_foreign" ON "erp_candidate_score" ("candidate_form_id");
CREATE INDEX "erp_candidate_score_schedule_id_foreign" ON "erp_candidate_score" ("schedule_id");
CREATE INDEX "erp_candidate_score_created_by_foreign" ON "erp_candidate_score" ("created_by");
CREATE INDEX "erp_candidate_score_updated_by_foreign" ON "erp_candidate_score" ("updated_by");
CREATE INDEX "erp_candidate_score_deleted_by_foreign" ON "erp_candidate_score" ("deleted_by");

--
-- Indexes for table `erp_category_policies`
--
ALTER TABLE "erp_category_policies" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_child_benefit`
--
ALTER TABLE "erp_child_benefit" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_city`
--
ALTER TABLE "erp_city" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_companies`
--
ALTER TABLE "erp_companies" ADD PRIMARY KEY ("id");
CREATE INDEX "erp_companies_created_by_foreign" ON "erp_companies" ("created_by");
CREATE INDEX "erp_companies_updated_by_foreign" ON "erp_companies" ("updated_by");
CREATE INDEX "erp_companies_deleted_by_foreign" ON "erp_companies" ("deleted_by");

--
-- Indexes for table `erp_country`
--
ALTER TABLE "erp_country" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_currencies`
--
ALTER TABLE "erp_currencies" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_daily_attendance`
--
ALTER TABLE "erp_daily_attendance" ADD PRIMARY KEY ("daily_attendance_id");

--
-- Indexes for table `erp_entries`
--
ALTER TABLE "erp_entries" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_entry_items`
--
ALTER TABLE "erp_entry_items" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_entry_templates`
--
ALTER TABLE "erp_entry_templates" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_entry_template_details`
--
ALTER TABLE "erp_entry_template_details" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_entry_types`
--
ALTER TABLE "erp_entry_types" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_fee_head`
--
ALTER TABLE "erp_fee_head" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_financial_years`
--
ALTER TABLE "erp_financial_years" ADD PRIMARY KEY ("id");
CREATE INDEX "erp_financial_years_created_by_foreign" ON "erp_financial_years" ("created_by");
CREATE INDEX "erp_financial_years_updated_by_foreign" ON "erp_financial_years" ("updated_by");
CREATE INDEX "erp_financial_years_deleted_by_foreign" ON "erp_financial_years" ("deleted_by");

--
-- Indexes for table `erp_financial_year_closing`
--
ALTER TABLE "erp_financial_year_closing" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_groups`
--
ALTER TABLE "erp_groups" ADD PRIMARY KEY ("id");
CREATE INDEX "erp_groups_account_type_id_foreign" ON "erp_groups" ("account_type_id");
CREATE INDEX "erp_groups_created_by_foreign" ON "erp_groups" ("created_by");
CREATE INDEX "erp_groups_updated_by_foreign" ON "erp_groups" ("updated_by");
CREATE INDEX "erp_groups_deleted_by_foreign" ON "erp_groups" ("deleted_by");

--
-- Indexes for table `erp_holidays`
--
ALTER TABLE "erp_holidays" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_hrm_leaves`
--
ALTER TABLE "erp_hrm_leaves" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_hrm_leave_entitlements`
--
ALTER TABLE "erp_hrm_leave_entitlements" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_hrm_leave_periods`
--
ALTER TABLE "erp_hrm_leave_periods" ADD PRIMARY KEY ("id");
CREATE INDEX "hrm_leave_periods_created_by_foreign" ON "erp_hrm_leave_periods" ("created_by");
CREATE INDEX "hrm_leave_periods_updated_by_foreign" ON "erp_hrm_leave_periods" ("updated_by");
CREATE INDEX "hrm_leave_periods_deleted_by_foreign" ON "erp_hrm_leave_periods" ("deleted_by");

--
-- Indexes for table `erp_hrm_leave_requests`
--
ALTER TABLE "erp_hrm_leave_requests" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_hrm_leave_statuses`
--
ALTER TABLE "erp_hrm_leave_statuses" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_hrm_leave_types`
--
ALTER TABLE "erp_hrm_leave_types" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_hrm_work_shifts`
--
ALTER TABLE "erp_hrm_work_shifts" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_hrm_work_weeks`
--
ALTER TABLE "erp_hrm_work_weeks" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_inventorytransfer`
--
ALTER TABLE "erp_inventorytransfer" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_inventorytransferdetail`
--
ALTER TABLE "erp_inventorytransferdetail" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_laws`
--
ALTER TABLE "erp_laws" ADD PRIMARY KEY ("law_id");

--
-- Indexes for table `erp_law_rates`
--
ALTER TABLE "erp_law_rates" ADD PRIMARY KEY ("law_rate_id");

--
-- Indexes for table `erp_ledgers`
--
ALTER TABLE "erp_ledgers" ADD PRIMARY KEY ("id");
CREATE INDEX "erp_ledgers_account_type_id_foreign" ON "erp_ledgers" ("account_type_id");
CREATE INDEX "erp_ledgers_branch_id_foreign" ON "erp_ledgers" ("branch_id");
CREATE INDEX "erp_ledgers_created_by_foreign" ON "erp_ledgers" ("created_by");
CREATE INDEX "erp_ledgers_updated_by_foreign" ON "erp_ledgers" ("updated_by");
CREATE INDEX "erp_ledgers_deleted_by_foreign" ON "erp_ledgers" ("deleted_by");

--
-- Indexes for table `erp_loans`
--
ALTER TABLE "erp_loans" ADD PRIMARY KEY ("loan_id");

--
-- Indexes for table `erp_loan_plans`
--
ALTER TABLE "erp_loan_plans" ADD PRIMARY KEY ("loan_plan_id");

--
-- Indexes for table `erp_model_has_permissions`
--
ALTER TABLE "erp_model_has_permissions" ADD PRIMARY KEY ("permission_id", "model_id", "model_type");
CREATE INDEX "erp_model_has_permissions_model_id_model_type_index" ON "erp_model_has_permissions" ("model_id", "model_type");

--
-- Indexes for table `erp_model_has_roles`
--
ALTER TABLE "erp_model_has_roles" ADD PRIMARY KEY ("role_id", "model_id", "model_type");
CREATE INDEX "erp_model_has_roles_model_id_model_type_index" ON "erp_model_has_roles" ("model_id", "model_type");

--
-- Indexes for table `erp_notifications`
--
ALTER TABLE "erp_notifications" ADD PRIMARY KEY ("notify_id");

--
-- Indexes for table `erp_password_resets`
--
CREATE INDEX "erp_password_resets_email_index" ON "erp_password_resets" ("email");

--
-- Indexes for table `erp_payees_amounts`
--
ALTER TABLE "erp_payees_amounts" ADD PRIMARY KEY ("id");
CREATE INDEX "erp_payees_amounts_payee_id_foreign" ON "erp_payees_amounts" ("payee_id");
CREATE INDEX "erp_payees_amounts_building_id_foreign" ON "erp_payees_amounts" ("building_id");

--
-- Indexes for table `erp_payee_lists`
--
ALTER TABLE "erp_payee_lists" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_payment_methods`
--
ALTER TABLE "erp_payment_methods" ADD PRIMARY KEY ("id");
CREATE INDEX "erp_payment_methods_created_by_foreign" ON "erp_payment_methods" ("created_by");
CREATE INDEX "erp_payment_methods_updated_by_foreign" ON "erp_payment_methods" ("updated_by");
CREATE INDEX "erp_payment_methods_deleted_by_foreign" ON "erp_payment_methods" ("deleted_by");

--
-- Indexes for table `erp_payment_sheet`
--
ALTER TABLE "erp_payment_sheet" ADD PRIMARY KEY ("sheet_id");

--
-- Indexes for table `erp_payment_sheet_details`
--
ALTER TABLE "erp_payment_sheet_details" ADD PRIMARY KEY ("ps_id");

--
-- Indexes for table `erp_permissions`
--
ALTER TABLE "erp_permissions" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_permission_role`
--
ALTER TABLE "erp_permission_role" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_policies`
--
ALTER TABLE "erp_policies" ADD PRIMARY KEY ("id");
CREATE INDEX "erp_policies_category_policy_id_foreign" ON "erp_policies" ("category_policy_id");

--
-- Indexes for table `erp_roles`
--
ALTER TABLE "erp_roles" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_role_has_permissions`
--
ALTER TABLE "erp_role_has_permissions" ADD PRIMARY KEY ("permission_id", "role_id");
CREATE INDEX "erp_role_has_permissions_role_id_foreign" ON "erp_role_has_permissions" ("role_id");

--
-- Indexes for table `erp_settings`
--
ALTER TABLE "erp_settings" ADD PRIMARY KEY ("id");
CREATE INDEX "erp_settings_created_by_foreign" ON "erp_settings" ("created_by");
CREATE INDEX "erp_settings_updated_by_foreign" ON "erp_settings" ("updated_by");
CREATE INDEX "erp_settings_deleted_by_foreign" ON "erp_settings" ("deleted_by");

--
-- Indexes for table `erp_staff_salaries`
--
ALTER TABLE "erp_staff_salaries" ADD PRIMARY KEY ("id");

--
-- Indexes for table `erp_tax_settings`
--
ALTER TABLE "erp_tax_settings" ADD PRIMARY KEY ("id");
CREATE INDEX "erp_tax_settings_created_by_foreign" ON "erp_tax_settings" ("created_by");
CREATE INDEX "erp_tax_settings_updated_by_foreign" ON "erp_tax_settings" ("updated_by");
CREATE INDEX "erp_tax_settings_deleted_by_foreign" ON "erp_tax_settings" ("deleted_by");

--
-- Indexes for table `erp_users`
--
ALTER TABLE "erp_users" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX "erp_users_email_unique" ON "erp_users" ("email");

--
-- Indexes for table `erp_vendor`
--
ALTER TABLE "erp_vendor" ADD PRIMARY KEY ("vendor_id");

--
-- Indexes for table `erp_workdays`
--
ALTER TABLE "erp_workdays" ADD PRIMARY KEY ("id");
CREATE INDEX "erp_workdays_applicable_to_foreign" ON "erp_workdays" ("applicable_to");
CREATE INDEX "erp_workdays_created_by_foreign" ON "erp_workdays" ("created_by");
CREATE INDEX "erp_workdays_updated_by_foreign" ON "erp_workdays" ("updated_by");
CREATE INDEX "erp_workdays_deleted_by_foreign" ON "erp_workdays" ("deleted_by");

--
-- Indexes for table `event_case_log`
--
ALTER TABLE "event_case_log" ADD PRIMARY KEY ("id");

--
-- Indexes for table `event_images`
--
ALTER TABLE "event_images" ADD PRIMARY KEY ("id");

--
-- Indexes for table `event_models`
--
ALTER TABLE "event_models" ADD PRIMARY KEY ("id");

--
-- Indexes for table `event_time_tables`
--
ALTER TABLE "event_time_tables" ADD PRIMARY KEY ("id");
CREATE INDEX "event_time_tables_time_table_id_foreign" ON "event_time_tables" ("time_table_id");
CREATE INDEX "event_time_tables_created_by_foreign" ON "event_time_tables" ("created_by");
CREATE INDEX "event_time_tables_updated_by_foreign" ON "event_time_tables" ("updated_by");

--
-- Indexes for table `examguide`
--
ALTER TABLE "examguide" ADD PRIMARY KEY ("id");

--
-- Indexes for table `exams`
--
ALTER TABLE "exams" ADD PRIMARY KEY ("id");

--
-- Indexes for table `exam_center_draft_amount`
--
ALTER TABLE "exam_center_draft_amount" ADD PRIMARY KEY ("id");

--
-- Indexes for table `exam_mark_ledgers`
--
ALTER TABLE "exam_mark_ledgers" ADD PRIMARY KEY ("id");

--
-- Indexes for table `exam_schedules`
--
ALTER TABLE "exam_schedules" ADD PRIMARY KEY ("id");

--
-- Indexes for table `exam_schedule_details`
--
ALTER TABLE "exam_schedule_details" ADD PRIMARY KEY ("id");

--
-- Indexes for table `exam_time_tables`
--
ALTER TABLE "exam_time_tables" ADD PRIMARY KEY ("id");

--
-- Indexes for table `faculties`
--
ALTER TABLE "faculties" ADD PRIMARY KEY ("id");

--
-- Indexes for table `faculty_semesters`
--
ALTER TABLE "faculty_semesters" ADD PRIMARY KEY ("id");

--
-- Indexes for table `faculty_semester_timetables`
--
ALTER TABLE "faculty_semester_timetables" ADD PRIMARY KEY ("id");

--
-- Indexes for table `faculty_subjects`
--
ALTER TABLE "faculty_subjects" ADD PRIMARY KEY ("id");

--
-- Indexes for table `fee_accounts_relationship`
--
ALTER TABLE "fee_accounts_relationship" ADD PRIMARY KEY ("id");

--
-- Indexes for table `fee_automate`
--
ALTER TABLE "fee_automate" ADD PRIMARY KEY ("fa_id");

--
-- Indexes for table `fee_bill_edit_history`
--
ALTER TABLE "fee_bill_edit_history" ADD PRIMARY KEY ("id");

--
-- Indexes for table `fee_collections`
--
ALTER TABLE "fee_collections" ADD PRIMARY KEY ("id");
CREATE INDEX "fee_collections_branch_id_index" ON "fee_collections" ("branch_id");
CREATE INDEX "fee_collections_paid_date_index" ON "fee_collections" ("paid_date");
CREATE INDEX "fee_collections_bank_ledger_id_index" ON "fee_collections" ("bank_ledger_id");

--
-- Indexes for table `fee_collection_detail`
--
ALTER TABLE "fee_collection_detail" ADD PRIMARY KEY ("id");

--
-- Indexes for table `fee_heads`
--
ALTER TABLE "fee_heads" ADD PRIMARY KEY ("id");

--
-- Indexes for table `fee_history_record`
--
ALTER TABLE "fee_history_record" ADD PRIMARY KEY ("id");

--
-- Indexes for table `fee_masters`
--
ALTER TABLE "fee_masters" ADD PRIMARY KEY ("id");

--
-- Indexes for table `fee_master_basics`
--
ALTER TABLE "fee_master_basics" ADD PRIMARY KEY ("id");

--
-- Indexes for table `fee_reconcilation_record`
--
ALTER TABLE "fee_reconcilation_record" ADD PRIMARY KEY ("id");

--
-- Indexes for table `fee_refunds`
--
ALTER TABLE "fee_refunds" ADD PRIMARY KEY ("id");

--
-- Indexes for table `fee_scholarship_defination`
--
ALTER TABLE "fee_scholarship_defination" ADD PRIMARY KEY ("id");

--
-- Indexes for table `fee_scholarship_definations`
--
ALTER TABLE "fee_scholarship_definations" ADD PRIMARY KEY ("id");

--
-- Indexes for table `fee_scholarship_details`
--
ALTER TABLE "fee_scholarship_details" ADD PRIMARY KEY ("id");

--
-- Indexes for table `fee_sections`
--
ALTER TABLE "fee_sections" ADD PRIMARY KEY ("id");

--
-- Indexes for table `fee_structures`
--
ALTER TABLE "fee_structures" ADD PRIMARY KEY ("id");

--
-- Indexes for table `fee_terms`
--
ALTER TABLE "fee_terms" ADD PRIMARY KEY ("id");

--
-- Indexes for table `fee_voucher_history`
--
ALTER TABLE "fee_voucher_history" ADD PRIMARY KEY ("id");

--
-- Indexes for table `fee_voucher_history_details`
--
ALTER TABLE "fee_voucher_history_details" ADD PRIMARY KEY ("id");

--
-- Indexes for table `general_settings`
--
ALTER TABLE "general_settings" ADD PRIMARY KEY ("id");

--
-- Indexes for table `goods_requested_process`
--
ALTER TABLE "goods_requested_process" ADD PRIMARY KEY ("id");

--
-- Indexes for table `grading_scales`
--
ALTER TABLE "grading_scales" ADD PRIMARY KEY ("id");

--
-- Indexes for table `grading_types`
--
ALTER TABLE "grading_types" ADD PRIMARY KEY ("id");

--
-- Indexes for table `groups`
--
ALTER TABLE "groups" ADD PRIMARY KEY ("id");

--
-- Indexes for table `group_categories`
--
ALTER TABLE "group_categories" ADD PRIMARY KEY ("id");

--
-- Indexes for table `group_comments`
--
ALTER TABLE "group_comments" ADD PRIMARY KEY ("id");

--
-- Indexes for table `group_events`
--
ALTER TABLE "group_events" ADD PRIMARY KEY ("id");

--
-- Indexes for table `group_event_students`
--
ALTER TABLE "group_event_students" ADD PRIMARY KEY ("id");
CREATE INDEX "group_event_students_group_event_id_foreign" ON "group_event_students" ("group_event_id");
CREATE INDEX "group_event_students_student_id_foreign" ON "group_event_students" ("student_id");

--
-- Indexes for table `guardian_details`
--
ALTER TABLE "guardian_details" ADD PRIMARY KEY ("id");
CREATE INDEX "idx_guardian_details_cnic" ON "guardian_details" ("cnic");
CREATE INDEX "idx_guardian_details_student" ON "guardian_details" ("student_id");

--
-- Indexes for table `hrm_work_weeks`
--
ALTER TABLE "hrm_work_weeks" ADD PRIMARY KEY ("id");
CREATE INDEX "hrm_work_weeks_created_by_foreign" ON "hrm_work_weeks" ("created_by");
CREATE INDEX "hrm_work_weeks_updated_by_foreign" ON "hrm_work_weeks" ("updated_by");
CREATE INDEX "hrm_work_weeks_deleted_by_foreign" ON "hrm_work_weeks" ("deleted_by");

--
-- Indexes for table `hr_failed_jobs`
--
ALTER TABLE "hr_failed_jobs" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX "hr_failed_jobs_uuid_unique" ON "hr_failed_jobs" ("uuid");

--
-- Indexes for table `hr_model_has_permissions`
--
ALTER TABLE "hr_model_has_permissions" ADD PRIMARY KEY ("permission_id", "model_id", "model_type");
CREATE INDEX "model_has_permissions_model_id_model_type_index" ON "hr_model_has_permissions" ("model_id", "model_type");

--
-- Indexes for table `hr_model_has_roles`
--
ALTER TABLE "hr_model_has_roles" ADD PRIMARY KEY ("role_id", "model_id", "model_type");
CREATE INDEX "model_has_roles_model_id_model_type_index" ON "hr_model_has_roles" ("model_id", "model_type");

--
-- Indexes for table `hr_password_resets`
--
CREATE INDEX "hr_password_resets_email_index" ON "hr_password_resets" ("email");

--
-- Indexes for table `hr_permissions`
--
ALTER TABLE "hr_permissions" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX "hr_permissions_name_guard_name_unique" ON "hr_permissions" ("name", "guard_name");

--
-- Indexes for table `hr_roles`
--
ALTER TABLE "hr_roles" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX "hr_roles_name_guard_name_unique" ON "hr_roles" ("name", "guard_name");

--
-- Indexes for table `hr_role_has_permissions`
--
ALTER TABLE "hr_role_has_permissions" ADD PRIMARY KEY ("permission_id", "role_id");
CREATE INDEX "hr_role_has_permissions_role_id_foreign" ON "hr_role_has_permissions" ("role_id");

--
-- Indexes for table `idcards`
--
ALTER TABLE "idcards" ADD PRIMARY KEY ("id");

--
-- Indexes for table `increment_pfs`
--
ALTER TABLE "increment_pfs" ADD PRIMARY KEY ("id");

--
-- Indexes for table `installment_plans`
--
ALTER TABLE "installment_plans" ADD PRIMARY KEY ("id");

--
-- Indexes for table `intake`
--
ALTER TABLE "intake" ADD PRIMARY KEY ("id");

--
-- Indexes for table `in_out_logs`
--
ALTER TABLE "in_out_logs" ADD PRIMARY KEY ("id");

--
-- Indexes for table `job_post`
--
ALTER TABLE "job_post" ADD PRIMARY KEY ("id");
CREATE INDEX "job_post_job_post_request_id_foreign" ON "job_post" ("job_post_request_id");
CREATE INDEX "job_post_created_by_foreign" ON "job_post" ("created_by");
CREATE INDEX "job_post_updated_by_foreign" ON "job_post" ("updated_by");
CREATE INDEX "job_post_deleted_by_foreign" ON "job_post" ("deleted_by");

--
-- Indexes for table `job_post_request`
--
ALTER TABLE "job_post_request" ADD PRIMARY KEY ("id");
CREATE INDEX "job_post_request_subject_id_foreign" ON "job_post_request" ("subject_id");
CREATE INDEX "job_post_request_created_by_foreign" ON "job_post_request" ("created_by");
CREATE INDEX "job_post_request_updated_by_foreign" ON "job_post_request" ("updated_by");
CREATE INDEX "job_post_request_deleted_by_foreign" ON "job_post_request" ("deleted_by");

--
-- Indexes for table `labs`
--
ALTER TABLE "labs" ADD PRIMARY KEY ("id");
CREATE INDEX "labs_created_by_foreign" ON "labs" ("created_by");
CREATE INDEX "labs_updated_by_foreign" ON "labs" ("updated_by");
CREATE INDEX "labs_deleted_by_foreign" ON "labs" ("deleted_by");

--
-- Indexes for table `lab_time_table`
--
ALTER TABLE "lab_time_table" ADD PRIMARY KEY ("id");
CREATE INDEX "lab_time_table_time_table_id_foreign" ON "lab_time_table" ("time_table_id");
CREATE INDEX "lab_time_table_created_by_foreign" ON "lab_time_table" ("created_by");
CREATE INDEX "lab_time_table_updated_by_foreign" ON "lab_time_table" ("updated_by");

--
-- Indexes for table `learner_profiles`
--
ALTER TABLE "learner_profiles" ADD PRIMARY KEY ("id");

--
-- Indexes for table `leavemanagements`
--
ALTER TABLE "leavemanagements" ADD PRIMARY KEY ("id");

--
-- Indexes for table `leave_type_staff_types`
--
ALTER TABLE "leave_type_staff_types" ADD PRIMARY KEY ("id");

--
-- Indexes for table `lecture_base_salarysheet_child_model`
--
ALTER TABLE "lecture_base_salarysheet_child_model" ADD PRIMARY KEY ("id");

--
-- Indexes for table `lecture_base_salarysheet_parent_model`
--
ALTER TABLE "lecture_base_salarysheet_parent_model" ADD PRIMARY KEY ("id");

--
-- Indexes for table `lessons`
--
ALTER TABLE "lessons" ADD PRIMARY KEY ("id");

--
-- Indexes for table `library_circulation`
--
ALTER TABLE "library_circulation" ADD PRIMARY KEY ("id");

--
-- Indexes for table `library_members`
--
ALTER TABLE "library_members" ADD PRIMARY KEY ("id");

--
-- Indexes for table `loans`
--
ALTER TABLE "loans" ADD PRIMARY KEY ("id");

--
-- Indexes for table `login_detail`
--
ALTER TABLE "login_detail" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX "login_detail_start_time_unique" ON "login_detail" ("start_time");
CREATE INDEX "login_detail_user_id_foreign" ON "login_detail" ("user_id");
CREATE INDEX "login_detail_created_by_foreign" ON "login_detail" ("created_by");
CREATE INDEX "login_detail_updated_by_foreign" ON "login_detail" ("updated_by");
CREATE INDEX "login_detail_deleted_by_foreign" ON "login_detail" ("deleted_by");

--
-- Indexes for table `login_details`
--
ALTER TABLE "login_details" ADD PRIMARY KEY ("id");
CREATE INDEX "login_details_user_id_foreign" ON "login_details" ("user_id");

--
-- Indexes for table `migrations`
--
ALTER TABLE "migrations" ADD PRIMARY KEY ("id");

--
-- Indexes for table `months`
--
ALTER TABLE "months" ADD PRIMARY KEY ("id");

--
-- Indexes for table `notes`
--
ALTER TABLE "notes" ADD PRIMARY KEY ("id");

--
-- Indexes for table `notices`
--
ALTER TABLE "notices" ADD PRIMARY KEY ("id");

--
-- Indexes for table `notifications`
--
ALTER TABLE "notifications" ADD PRIMARY KEY ("id");

--
-- Indexes for table `parent_details`
--
ALTER TABLE "parent_details" ADD PRIMARY KEY ("id");
CREATE INDEX "parent_details_students_id_foreign" ON "parent_details" ("students_id");
CREATE INDEX "idx_parent_details_student" ON "parent_details" ("students_id");

--
-- Indexes for table `password_resets`
--
CREATE INDEX "password_resets_email_index" ON "password_resets" ("email");

--
-- Indexes for table `past_paper`
--
ALTER TABLE "past_paper" ADD PRIMARY KEY ("id");

--
-- Indexes for table `payment_methods`
--
ALTER TABLE "payment_methods" ADD PRIMARY KEY ("id");

--
-- Indexes for table `payment_settings`
--
ALTER TABLE "payment_settings" ADD PRIMARY KEY ("id");

--
-- Indexes for table `payrolls`
--
ALTER TABLE "payrolls" ADD PRIMARY KEY ("id");

--
-- Indexes for table `payroll_employees`
--
ALTER TABLE "payroll_employees" ADD PRIMARY KEY ("id");

--
-- Indexes for table `permissions`
--
ALTER TABLE "permissions" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX "permissions_name_unique" ON "permissions" ("name");

--
-- Indexes for table `permission_role`
--
ALTER TABLE "permission_role" ADD PRIMARY KEY ("permission_id", "role_id");
CREATE INDEX "permission_role_role_id_foreign" ON "permission_role" ("role_id");

--
-- Indexes for table `permission_user`
--
ALTER TABLE "permission_user" ADD PRIMARY KEY ("user_id", "permission_id", "user_type");
CREATE INDEX "permission_user_permission_id_foreign" ON "permission_user" ("permission_id");

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE "personal_access_tokens" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX "personal_access_tokens_token_unique" ON "personal_access_tokens" ("token");
CREATE INDEX "personal_access_tokens_tokenable_type_tokenable_id_index" ON "personal_access_tokens" ("tokenable_type", "tokenable_id");

--
-- Indexes for table `portfolio`
--
ALTER TABLE "portfolio" ADD PRIMARY KEY ("id");

--
-- Indexes for table `portfolio_files`
--
ALTER TABLE "portfolio_files" ADD PRIMARY KEY ("id");

--
-- Indexes for table `prerequisite`
--
ALTER TABLE "prerequisite" ADD PRIMARY KEY ("id");

--
-- Indexes for table `product`
--
ALTER TABLE "product" ADD PRIMARY KEY ("id");

--
-- Indexes for table `products`
--
ALTER TABLE "products" ADD PRIMARY KEY ("id");

--
-- Indexes for table `programs`
--
ALTER TABLE "programs" ADD PRIMARY KEY ("id");
CREATE INDEX "programs_created_by_foreign" ON "programs" ("created_by");
CREATE INDEX "programs_updated_by_foreign" ON "programs" ("updated_by");
CREATE INDEX "programs_deleted_by_foreign" ON "programs" ("deleted_by");

--
-- Indexes for table `program_subject`
--
ALTER TABLE "program_subject" ADD PRIMARY KEY ("id");

--
-- Indexes for table `program_term`
--
ALTER TABLE "program_term" ADD PRIMARY KEY ("id");

--
-- Indexes for table `program_terms`
--
ALTER TABLE "program_terms" ADD PRIMARY KEY ("id");
CREATE INDEX "program_terms_program_id_foreign" ON "program_terms" ("program_id");
CREATE INDEX "program_terms_term_id_foreign" ON "program_terms" ("term_id");

--
-- Indexes for table `promotion`
--
ALTER TABLE "promotion" ADD PRIMARY KEY ("id");

--
-- Indexes for table `published_exam`
--
ALTER TABLE "published_exam" ADD PRIMARY KEY ("id");

--
-- Indexes for table `quiz`
--
ALTER TABLE "quiz" ADD PRIMARY KEY ("id");

--
-- Indexes for table `quizzes`
--
ALTER TABLE "quizzes" ADD PRIMARY KEY ("id");

--
-- Indexes for table `quiz_mark_ledgers`
--
ALTER TABLE "quiz_mark_ledgers" ADD PRIMARY KEY ("id");

--
-- Indexes for table `quiz_schedules`
--
ALTER TABLE "quiz_schedules" ADD PRIMARY KEY ("id");

--
-- Indexes for table `quiz_timetables`
--
ALTER TABLE "quiz_timetables" ADD PRIMARY KEY ("id");

--
-- Indexes for table `recruitment_feedback`
--
ALTER TABLE "recruitment_feedback" ADD PRIMARY KEY ("id");

--
-- Indexes for table `report_groups`
--
ALTER TABLE "report_groups" ADD PRIMARY KEY ("id");

--
-- Indexes for table `report_parameters`
--
ALTER TABLE "report_parameters" ADD PRIMARY KEY ("id");

--
-- Indexes for table `requested_goods_branches`
--
ALTER TABLE "requested_goods_branches" ADD PRIMARY KEY ("id");

--
-- Indexes for table `request_approvals`
--
ALTER TABLE "request_approvals" ADD PRIMARY KEY ("id");

--
-- Indexes for table `request_loan_employee`
--
ALTER TABLE "request_loan_employee" ADD PRIMARY KEY ("id");

--
-- Indexes for table `residents`
--
ALTER TABLE "residents" ADD PRIMARY KEY ("id");

--
-- Indexes for table `resident_histories`
--
ALTER TABLE "resident_histories" ADD PRIMARY KEY ("id");

--
-- Indexes for table `resigns`
--
ALTER TABLE "resigns" ADD PRIMARY KEY ("id");

--
-- Indexes for table `restricted_leave_months`
--
ALTER TABLE "restricted_leave_months" ADD PRIMARY KEY ("id");

--
-- Indexes for table `return_policies`
--
ALTER TABLE "return_policies" ADD PRIMARY KEY ("id");

--
-- Indexes for table `roles`
--
ALTER TABLE "roles" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX "roles_name_unique" ON "roles" ("name");

--
-- Indexes for table `role_user`
--
ALTER TABLE "role_user" ADD PRIMARY KEY ("user_id", "role_id", "user_type");
CREATE INDEX "role_user_role_id_foreign" ON "role_user" ("role_id");

--
-- Indexes for table `rooms`
--
ALTER TABLE "rooms" ADD PRIMARY KEY ("id");
CREATE INDEX "rooms_building_id_foreign" ON "rooms" ("building_id");
CREATE INDEX "rooms_created_by_foreign" ON "rooms" ("created_by");
CREATE INDEX "rooms_updated_by_foreign" ON "rooms" ("updated_by");
CREATE INDEX "rooms_deleted_by_foreign" ON "rooms" ("deleted_by");

--
-- Indexes for table `room_types`
--
ALTER TABLE "room_types" ADD PRIMARY KEY ("id");

--
-- Indexes for table `schedule`
--
ALTER TABLE "schedule" ADD PRIMARY KEY ("id");
CREATE INDEX "schedule_candidate_form_id_foreign" ON "schedule" ("candidate_form_id");
CREATE INDEX "schedule_branch_id_foreign" ON "schedule" ("branch_id");
CREATE INDEX "schedule_created_by_foreign" ON "schedule" ("created_by");
CREATE INDEX "schedule_updated_by_foreign" ON "schedule" ("updated_by");
CREATE INDEX "schedule_deleted_by_foreign" ON "schedule" ("deleted_by");

--
-- Indexes for table `sections`
--
ALTER TABLE "sections" ADD PRIMARY KEY ("id");
CREATE INDEX "sections_created_by_foreign" ON "sections" ("created_by");
CREATE INDEX "sections_updated_by_foreign" ON "sections" ("updated_by");
CREATE INDEX "sections_deleted_by_foreign" ON "sections" ("deleted_by");

--
-- Indexes for table `semesters`
--
ALTER TABLE "semesters" ADD PRIMARY KEY ("id");

--
-- Indexes for table `services_type`
--
ALTER TABLE "services_type" ADD PRIMARY KEY ("id");

--
-- Indexes for table `sessions`
--
ALTER TABLE "sessions" ADD PRIMARY KEY ("id");
CREATE INDEX "sessions_created_by_foreign" ON "sessions" ("created_by");
CREATE INDEX "sessions_updated_by_foreign" ON "sessions" ("updated_by");
CREATE INDEX "sessions_deleted_by_foreign" ON "sessions" ("deleted_by");

--
-- Indexes for table `shared_todos`
--
ALTER TABLE "shared_todos" ADD PRIMARY KEY ("id");

--
-- Indexes for table `sms_settings`
--
ALTER TABLE "sms_settings" ADD PRIMARY KEY ("id");

--
-- Indexes for table `sos_staff_history`
--
ALTER TABLE "sos_staff_history" ADD PRIMARY KEY ("id");

--
-- Indexes for table `staff`
--
ALTER TABLE "staff" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX "staff_email_unique" ON "staff" ("email");
CREATE UNIQUE INDEX "staff_cnic_unique" ON "staff" ("cnic");
CREATE INDEX "staff_user_id_foreign" ON "staff" ("user_id");
CREATE INDEX "staff_branch_id_foreign" ON "staff" ("branch_id");
CREATE INDEX "staff_created_by_foreign" ON "staff" ("created_by");
CREATE INDEX "staff_updated_by_foreign" ON "staff" ("updated_by");
CREATE INDEX "staff_deleted_by_foreign" ON "staff" ("deleted_by");

--
-- Indexes for table `staff_assets`
--
ALTER TABLE "staff_assets" ADD PRIMARY KEY ("id");

--
-- Indexes for table `staff_bank_accounts`
--
ALTER TABLE "staff_bank_accounts" ADD PRIMARY KEY ("id");

--
-- Indexes for table `staff_basic_information`
--
ALTER TABLE "staff_basic_information" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX "staff_basic_information_email_unique" ON "staff_basic_information" ("email");
CREATE UNIQUE INDEX "sbi_cnic_unique" ON "staff_basic_information" ("cnic");
CREATE INDEX "sbi_user_id_foreign" ON "staff_basic_information" ("user_id");
CREATE INDEX "sbi_branch_id_foreign" ON "staff_basic_information" ("branch_id");
CREATE INDEX "sbi_created_by_foreign" ON "staff_basic_information" ("created_by");
CREATE INDEX "sbi_updated_by_foreign" ON "staff_basic_information" ("updated_by");
CREATE INDEX "sbi_deleted_by_foreign" ON "staff_basic_information" ("deleted_by");

--
-- Indexes for table `staff_bi_branches`
--
ALTER TABLE "staff_bi_branches" ADD PRIMARY KEY ("id");

--
-- Indexes for table `staff_branches`
--
ALTER TABLE "staff_branches" ADD PRIMARY KEY ("id");

--
-- Indexes for table `staff_branch_transfer`
--
ALTER TABLE "staff_branch_transfer" ADD PRIMARY KEY ("id");

--
-- Indexes for table `staff_emergency_contacts`
--
ALTER TABLE "staff_emergency_contacts" ADD PRIMARY KEY ("id");

--
-- Indexes for table `staff_experiences`
--
ALTER TABLE "staff_experiences" ADD PRIMARY KEY ("id");

--
-- Indexes for table `staff_families`
--
ALTER TABLE "staff_families" ADD PRIMARY KEY ("id");

--
-- Indexes for table `staff_performances`
--
ALTER TABLE "staff_performances" ADD PRIMARY KEY ("id");

--
-- Indexes for table `staff_program_assign`
--
ALTER TABLE "staff_program_assign" ADD PRIMARY KEY ("id");

--
-- Indexes for table `staff_qualifications`
--
ALTER TABLE "staff_qualifications" ADD PRIMARY KEY ("id");

--
-- Indexes for table `staff_student_parents`
--
ALTER TABLE "staff_student_parents" ADD PRIMARY KEY ("id");
CREATE INDEX "staff_student_parents_staff_id_foreign" ON "staff_student_parents" ("staff_id");
CREATE INDEX "staff_student_parents_student_id_foreign" ON "staff_student_parents" ("student_id");
CREATE INDEX "staff_student_parents_guardian_id_foreign" ON "staff_student_parents" ("guardian_id");

--
-- Indexes for table `staff_transfer_branches`
--
ALTER TABLE "staff_transfer_branches" ADD PRIMARY KEY ("id");

--
-- Indexes for table `staff_type`
--
ALTER TABLE "staff_type" ADD PRIMARY KEY ("id");

--
-- Indexes for table `std_active_s_elecive`
--
ALTER TABLE "std_active_s_elecive" ADD PRIMARY KEY ("id");
CREATE INDEX "std_active_s_elecive_active_session_student_id_foreign" ON "std_active_s_elecive" ("active_session_student_id");
CREATE INDEX "std_active_s_elecive_course_id_foreign" ON "std_active_s_elecive" ("course_id");

--
-- Indexes for table `std_student_guardians`
--
ALTER TABLE "std_student_guardians" ADD PRIMARY KEY ("id");

--
-- Indexes for table `students`
--
ALTER TABLE "students" ADD PRIMARY KEY ("id");
CREATE INDEX "students_branch_id_foreign" ON "students" ("branch_id");
CREATE INDEX "students_board_id_foreign" ON "students" ("board_id");
CREATE INDEX "students_program_id_foreign" ON "students" ("program_id");
CREATE INDEX "students_academic_group_id_foreign" ON "students" ("academic_group_id");
CREATE INDEX "students_class_id_foreign" ON "students" ("class_id");
CREATE INDEX "students_term_id_foreign" ON "students" ("term_id");
CREATE INDEX "students_section_id_foreign" ON "students" ("section_id");
CREATE INDEX "students_user_id_foreign" ON "students" ("user_id");
CREATE INDEX "students_created_by_foreign" ON "students" ("created_by");
CREATE INDEX "students_updated_by_foreign" ON "students" ("updated_by");
CREATE INDEX "students_deleted_by_foreign" ON "students" ("deleted_by");
CREATE INDEX "idx_students_branch_reg" ON "students" ("branch_id", "reg_no");
CREATE INDEX "idx_students_branch_walkin" ON "students" ("branch_id", "walkin_reg_no");
CREATE INDEX "idx_students_session_admission" ON "students" ("session_id", "admission_status");
CREATE INDEX "idx_students_sos_created" ON "students" ("sos_status", "created_at");
CREATE INDEX "idx_students_status_created" ON "students" ("status", "created_at");
CREATE INDEX "idx_students_registered_session" ON "students" ("registered_session");

--
-- Indexes for table `student_attendance_payroll`
--
ALTER TABLE "student_attendance_payroll" ADD PRIMARY KEY ("id");

--
-- Indexes for table `student_enrollments`
--
ALTER TABLE "student_enrollments" ADD PRIMARY KEY ("id");

--
-- Indexes for table `student_enrollments_record`
--
ALTER TABLE "student_enrollments_record" ADD PRIMARY KEY ("id");

--
-- Indexes for table `student_fee_settings`
--
ALTER TABLE "student_fee_settings" ADD PRIMARY KEY ("id");

--
-- Indexes for table `student_guardians`
--
ALTER TABLE "student_guardians" ADD PRIMARY KEY ("id");
CREATE INDEX "idx_student_guardians_student" ON "student_guardians" ("students_id");
CREATE INDEX "idx_student_guardians_guardian" ON "student_guardians" ("guardians_id");

--
-- Indexes for table `student_reports`
--
ALTER TABLE "student_reports" ADD PRIMARY KEY ("id");

--
-- Indexes for table `student_report_details`
--
ALTER TABLE "student_report_details" ADD PRIMARY KEY ("id");

--
-- Indexes for table `student_sos_details`
--
ALTER TABLE "student_sos_details" ADD PRIMARY KEY ("id");

--
-- Indexes for table `student_sos_statuses`
--
ALTER TABLE "student_sos_statuses" ADD PRIMARY KEY ("id");

--
-- Indexes for table `student_status`
--
ALTER TABLE "student_status" ADD PRIMARY KEY ("id");

--
-- Indexes for table `student_statuses`
--
ALTER TABLE "student_statuses" ADD PRIMARY KEY ("id");

--
-- Indexes for table `student_transfer_history`
--
ALTER TABLE "student_transfer_history" ADD PRIMARY KEY ("id");

--
-- Indexes for table `subject_category_models`
--
ALTER TABLE "subject_category_models" ADD PRIMARY KEY ("id");

--
-- Indexes for table `subject_details`
--
ALTER TABLE "subject_details" ADD PRIMARY KEY ("id");

--
-- Indexes for table `subject_fee_details`
--
ALTER TABLE "subject_fee_details" ADD PRIMARY KEY ("subject_fee_details_id");

--
-- Indexes for table `subject_fee_master`
--
ALTER TABLE "subject_fee_master" ADD PRIMARY KEY ("subject_fee_id");

--
-- Indexes for table `subject_type`
--
ALTER TABLE "subject_type" ADD PRIMARY KEY ("id");

--
-- Indexes for table `syllabi`
--
ALTER TABLE "syllabi" ADD PRIMARY KEY ("id");

--
-- Indexes for table `syllabus_heads`
--
ALTER TABLE "syllabus_heads" ADD PRIMARY KEY ("id");

--
-- Indexes for table `tax_managements`
--
ALTER TABLE "tax_managements" ADD PRIMARY KEY ("id");

--
-- Indexes for table `tbl_attendance_date`
--
ALTER TABLE "tbl_attendance_date" ADD PRIMARY KEY ("ad_id");

--
-- Indexes for table `teacher_attendance_payroll`
--
ALTER TABLE "teacher_attendance_payroll" ADD PRIMARY KEY ("id");

--
-- Indexes for table `teacher_classes`
--
ALTER TABLE "teacher_classes" ADD PRIMARY KEY ("id");

--
-- Indexes for table `teacher_student_relation`
--
ALTER TABLE "teacher_student_relation" ADD PRIMARY KEY ("id");

--
-- Indexes for table `terminations`
--
ALTER TABLE "terminations" ADD PRIMARY KEY ("id");

--
-- Indexes for table `terms`
--
ALTER TABLE "terms" ADD PRIMARY KEY ("id");
CREATE INDEX "terms_academic_year_id_foreign" ON "terms" ("academic_year_id");
CREATE INDEX "terms_created_by_foreign" ON "terms" ("created_by");
CREATE INDEX "terms_updated_by_foreign" ON "terms" ("updated_by");
CREATE INDEX "terms_deleted_by_foreign" ON "terms" ("deleted_by");

--
-- Indexes for table `tier`
--
ALTER TABLE "tier" ADD PRIMARY KEY ("id");

--
-- Indexes for table `timetable_categories`
--
ALTER TABLE "timetable_categories" ADD PRIMARY KEY ("id");
CREATE INDEX "timetable_categories_created_by_foreign" ON "timetable_categories" ("created_by");
CREATE INDEX "timetable_categories_updated_by_foreign" ON "timetable_categories" ("updated_by");

--
-- Indexes for table `time_tables`
--
ALTER TABLE "time_tables" ADD PRIMARY KEY ("id");
CREATE INDEX "time_tables_branch_id_foreign" ON "time_tables" ("branch_id");
CREATE INDEX "time_tables_created_by_foreign" ON "time_tables" ("created_by");
CREATE INDEX "time_tables_updated_by_foreign" ON "time_tables" ("updated_by");

--
-- Indexes for table `time_table_slots`
--
ALTER TABLE "time_table_slots" ADD PRIMARY KEY ("id");

--
-- Indexes for table `todos`
--
ALTER TABLE "todos" ADD PRIMARY KEY ("id");

--
-- Indexes for table `trainees`
--
ALTER TABLE "trainees" ADD PRIMARY KEY ("id");
CREATE INDEX "trainees_training_id_foreign" ON "trainees" ("training_id");

--
-- Indexes for table `trainings`
--
ALTER TABLE "trainings" ADD PRIMARY KEY ("id");

--
-- Indexes for table `transactions`
--
ALTER TABLE "transactions" ADD PRIMARY KEY ("id");

--
-- Indexes for table `transaction_heads`
--
ALTER TABLE "transaction_heads" ADD PRIMARY KEY ("id");

--
-- Indexes for table `transfer_state_management`
--
ALTER TABLE "transfer_state_management" ADD PRIMARY KEY ("id");

--
-- Indexes for table `transfer_student_detail`
--
ALTER TABLE "transfer_student_detail" ADD PRIMARY KEY ("id");

--
-- Indexes for table `unit_planner`
--
ALTER TABLE "unit_planner" ADD PRIMARY KEY ("id");

--
-- Indexes for table `unit_planner_details`
--
ALTER TABLE "unit_planner_details" ADD PRIMARY KEY ("id");

--
-- Indexes for table `uom`
--
ALTER TABLE "uom" ADD PRIMARY KEY ("id");

--
-- Indexes for table `uploaded_documents`
--
ALTER TABLE "uploaded_documents" ADD PRIMARY KEY ("id");

--
-- Indexes for table `upload_experience_letters`
--
ALTER TABLE "upload_experience_letters" ADD PRIMARY KEY ("id");

--
-- Indexes for table `user`
--
ALTER TABLE "user" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX "user_email_unique" ON "user" ("email");

--
-- Indexes for table `users`
--
ALTER TABLE "users" ADD PRIMARY KEY ("id");

--
-- Indexes for table `user_pemissions`
--
ALTER TABLE "user_pemissions" ADD PRIMARY KEY ("id");

--
-- Indexes for table `utilitybills`
--
ALTER TABLE "utilitybills" ADD PRIMARY KEY ("id");

--
-- Indexes for table `walk_in_registration`
--
ALTER TABLE "walk_in_registration" ADD PRIMARY KEY ("id");

--
-- Indexes for table `weekdays`
--
ALTER TABLE "weekdays" ADD PRIMARY KEY ("id");

--
-- Indexes for table `work_plans`
--
ALTER TABLE "work_plans" ADD PRIMARY KEY ("id");

--
-- Indexes for table `work_plan_details`
--
ALTER TABLE "work_plan_details" ADD PRIMARY KEY ("id");

--
-- Indexes for table `zkteco_devices`
--
ALTER TABLE "zkteco_devices" ADD PRIMARY KEY ("id");

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `academics_groups`
--

--
-- AUTO_INCREMENT for table `academics_group_courses`
--

--
-- AUTO_INCREMENT for table `academic_infos`
--

--
-- AUTO_INCREMENT for table `accumulative_report`
--

--
-- AUTO_INCREMENT for table `accumulative_report_details`
--

--
-- AUTO_INCREMENT for table `active_sessions`
--

--
-- AUTO_INCREMENT for table `active_session_sections`
--

--
-- AUTO_INCREMENT for table `active_session_students`
--

--
-- AUTO_INCREMENT for table `active_session_teachers`
--

--
-- AUTO_INCREMENT for table `addressinfos`
--

--
-- AUTO_INCREMENT for table `add_goods_branch`
--

--
-- AUTO_INCREMENT for table `agendas`
--

--
-- AUTO_INCREMENT for table `alert_settings`
--

--
-- AUTO_INCREMENT for table `annual_calendars`
--

--
-- AUTO_INCREMENT for table `api_authentication_user`
--

--
-- AUTO_INCREMENT for table `api_payment_transaction`
--

--
-- AUTO_INCREMENT for table `approve_agendas`
--

--
-- AUTO_INCREMENT for table `assesment_types`
--

--
-- AUTO_INCREMENT for table `assessments`
--

--
-- AUTO_INCREMENT for table `assets`
--

--
-- AUTO_INCREMENT for table `assets_quantity`
--

--
-- AUTO_INCREMENT for table `assets_type`
--

--
-- AUTO_INCREMENT for table `assignments`
--

--
-- AUTO_INCREMENT for table `assignment_answers`
--

--
-- AUTO_INCREMENT for table `assign_active_session_course_lab`
--

--
-- AUTO_INCREMENT for table `assign_class_section`
--

--
-- AUTO_INCREMENT for table `assingment_student_data`
--

--
-- AUTO_INCREMENT for table `attendances`
--

--
-- AUTO_INCREMENT for table `attendance_masters`
--

--
-- AUTO_INCREMENT for table `attendance_statuses`
--

--
-- AUTO_INCREMENT for table `attendance_summary`
--

--
-- AUTO_INCREMENT for table `attendance__payrolls`
--

--
-- AUTO_INCREMENT for table `bank_account_request`
--

--
-- AUTO_INCREMENT for table `boards`
--

--
-- AUTO_INCREMENT for table `board_programs`
--

--
-- AUTO_INCREMENT for table `books`
--

--
-- AUTO_INCREMENT for table `book_categories`
--

--
-- AUTO_INCREMENT for table `book_issues`
--

--
-- AUTO_INCREMENT for table `book_masters`
--

--
-- AUTO_INCREMENT for table `book_status`
--

--
-- AUTO_INCREMENT for table `book_statuses`
--

--
-- AUTO_INCREMENT for table `bpc_term`
--

--
-- AUTO_INCREMENT for table `branch_board_program`
--

--
-- AUTO_INCREMENT for table `branch_departments`
--

--
-- AUTO_INCREMENT for table `brand`
--

--
-- AUTO_INCREMENT for table `buildings`
--

--
-- AUTO_INCREMENT for table `candidate_form`
--

--
-- AUTO_INCREMENT for table `category`
--

--
-- AUTO_INCREMENT for table `child_benefit_configs`
--

--
-- AUTO_INCREMENT for table `child_benefit_fee_heads_discount`
--

--
-- AUTO_INCREMENT for table `child_benefit_management`
--

--
-- AUTO_INCREMENT for table `child_benefit_students`
--

--
-- AUTO_INCREMENT for table `classes`
--

--
-- AUTO_INCREMENT for table `class_notice`
--

--
-- AUTO_INCREMENT for table `class_time_tables`
--

--
-- AUTO_INCREMENT for table `comments`
--

--
-- AUTO_INCREMENT for table `compulsory_courses`
--

--
-- AUTO_INCREMENT for table `corrections`
--

--
-- AUTO_INCREMENT for table `correction_details`
--

--
-- AUTO_INCREMENT for table `courses`
--

--
-- AUTO_INCREMENT for table `course_types`
--

--
-- AUTO_INCREMENT for table `curriculum`
--

--
-- AUTO_INCREMENT for table `curriculum_details`
--

--
-- AUTO_INCREMENT for table `date_sheet`
--

--
-- AUTO_INCREMENT for table `days`
--

--
-- AUTO_INCREMENT for table `departments`
--

--
-- AUTO_INCREMENT for table `designation`
--

--
-- AUTO_INCREMENT for table `devices`
--

--
-- AUTO_INCREMENT for table `diary`
--

--
-- AUTO_INCREMENT for table `discount_types`
--

--
-- AUTO_INCREMENT for table `documents`
--

--
-- AUTO_INCREMENT for table `downloads`
--

--
-- AUTO_INCREMENT for table `ec_timetables`
--

--
-- AUTO_INCREMENT for table `email_settings`
--

--
-- AUTO_INCREMENT for table `employee_attendance`
--

--
-- AUTO_INCREMENT for table `entry_types`
--

--
-- AUTO_INCREMENT for table `eobi_epf_register`
--

--
-- AUTO_INCREMENT for table `eobi_notifications`
--

--
-- AUTO_INCREMENT for table `erp_academic_year`
--

--
-- AUTO_INCREMENT for table `erp_account_types`
--

--
-- AUTO_INCREMENT for table `erp_attendances`
--

--
-- AUTO_INCREMENT for table `erp_attendance_logs`
--

--
-- AUTO_INCREMENT for table `erp_attendance_masters`
--

--
-- AUTO_INCREMENT for table `erp_attendance_statuses`
--

--
-- AUTO_INCREMENT for table `erp_bankdetail`
--

--
-- AUTO_INCREMENT for table `erp_banks`
--

--
-- AUTO_INCREMENT for table `erp_bank_loan`
--

--
-- AUTO_INCREMENT for table `erp_bank_reconcilation`
--

--
-- AUTO_INCREMENT for table `erp_branches`
--

--
-- AUTO_INCREMENT for table `erp_buildings`
--

--
-- AUTO_INCREMENT for table `erp_candidate_score`
--

--
-- AUTO_INCREMENT for table `erp_category_policies`
--

--
-- AUTO_INCREMENT for table `erp_child_benefit`
--

--
-- AUTO_INCREMENT for table `erp_city`
--

--
-- AUTO_INCREMENT for table `erp_companies`
--

--
-- AUTO_INCREMENT for table `erp_country`
--

--
-- AUTO_INCREMENT for table `erp_currencies`
--

--
-- AUTO_INCREMENT for table `erp_daily_attendance`
--

--
-- AUTO_INCREMENT for table `erp_entries`
--

--
-- AUTO_INCREMENT for table `erp_entry_items`
--

--
-- AUTO_INCREMENT for table `erp_entry_templates`
--

--
-- AUTO_INCREMENT for table `erp_entry_template_details`
--

--
-- AUTO_INCREMENT for table `erp_entry_types`
--

--
-- AUTO_INCREMENT for table `erp_fee_head`
--

--
-- AUTO_INCREMENT for table `erp_financial_years`
--

--
-- AUTO_INCREMENT for table `erp_financial_year_closing`
--

--
-- AUTO_INCREMENT for table `erp_groups`
--

--
-- AUTO_INCREMENT for table `erp_holidays`
--

--
-- AUTO_INCREMENT for table `erp_hrm_leaves`
--

--
-- AUTO_INCREMENT for table `erp_hrm_leave_entitlements`
--

--
-- AUTO_INCREMENT for table `erp_hrm_leave_periods`
--

--
-- AUTO_INCREMENT for table `erp_hrm_leave_requests`
--

--
-- AUTO_INCREMENT for table `erp_hrm_leave_statuses`
--

--
-- AUTO_INCREMENT for table `erp_hrm_leave_types`
--

--
-- AUTO_INCREMENT for table `erp_hrm_work_shifts`
--

--
-- AUTO_INCREMENT for table `erp_hrm_work_weeks`
--

--
-- AUTO_INCREMENT for table `erp_inventorytransfer`
--

--
-- AUTO_INCREMENT for table `erp_inventorytransferdetail`
--

--
-- AUTO_INCREMENT for table `erp_laws`
--

--
-- AUTO_INCREMENT for table `erp_law_rates`
--

--
-- AUTO_INCREMENT for table `erp_ledgers`
--

--
-- AUTO_INCREMENT for table `erp_loans`
--

--
-- AUTO_INCREMENT for table `erp_loan_plans`
--

--
-- AUTO_INCREMENT for table `erp_notifications`
--

--
-- AUTO_INCREMENT for table `erp_payees_amounts`
--

--
-- AUTO_INCREMENT for table `erp_payee_lists`
--

--
-- AUTO_INCREMENT for table `erp_payment_methods`
--

--
-- AUTO_INCREMENT for table `erp_payment_sheet`
--

--
-- AUTO_INCREMENT for table `erp_payment_sheet_details`
--

--
-- AUTO_INCREMENT for table `erp_permissions`
--

--
-- AUTO_INCREMENT for table `erp_permission_role`
--

--
-- AUTO_INCREMENT for table `erp_policies`
--

--
-- AUTO_INCREMENT for table `erp_roles`
--

--
-- AUTO_INCREMENT for table `erp_settings`
--

--
-- AUTO_INCREMENT for table `erp_staff_salaries`
--

--
-- AUTO_INCREMENT for table `erp_tax_settings`
--

--
-- AUTO_INCREMENT for table `erp_users`
--

--
-- AUTO_INCREMENT for table `erp_vendor`
--

--
-- AUTO_INCREMENT for table `erp_workdays`
--

--
-- AUTO_INCREMENT for table `event_case_log`
--

--
-- AUTO_INCREMENT for table `event_images`
--

--
-- AUTO_INCREMENT for table `event_models`
--

--
-- AUTO_INCREMENT for table `event_time_tables`
--

--
-- AUTO_INCREMENT for table `examguide`
--

--
-- AUTO_INCREMENT for table `exams`
--

--
-- AUTO_INCREMENT for table `exam_center_draft_amount`
--

--
-- AUTO_INCREMENT for table `exam_mark_ledgers`
--

--
-- AUTO_INCREMENT for table `exam_schedules`
--

--
-- AUTO_INCREMENT for table `exam_schedule_details`
--

--
-- AUTO_INCREMENT for table `exam_time_tables`
--

--
-- AUTO_INCREMENT for table `faculties`
--

--
-- AUTO_INCREMENT for table `faculty_semesters`
--

--
-- AUTO_INCREMENT for table `faculty_semester_timetables`
--

--
-- AUTO_INCREMENT for table `faculty_subjects`
--

--
-- AUTO_INCREMENT for table `fee_accounts_relationship`
--

--
-- AUTO_INCREMENT for table `fee_automate`
--

--
-- AUTO_INCREMENT for table `fee_bill_edit_history`
--

--
-- AUTO_INCREMENT for table `fee_collections`
--

--
-- AUTO_INCREMENT for table `fee_collection_detail`
--

--
-- AUTO_INCREMENT for table `fee_heads`
--

--
-- AUTO_INCREMENT for table `fee_history_record`
--

--
-- AUTO_INCREMENT for table `fee_masters`
--

--
-- AUTO_INCREMENT for table `fee_master_basics`
--

--
-- AUTO_INCREMENT for table `fee_reconcilation_record`
--

--
-- AUTO_INCREMENT for table `fee_refunds`
--

--
-- AUTO_INCREMENT for table `fee_scholarship_defination`
--

--
-- AUTO_INCREMENT for table `fee_scholarship_definations`
--

--
-- AUTO_INCREMENT for table `fee_scholarship_details`
--

--
-- AUTO_INCREMENT for table `fee_sections`
--

--
-- AUTO_INCREMENT for table `fee_structures`
--

--
-- AUTO_INCREMENT for table `fee_terms`
--

--
-- AUTO_INCREMENT for table `fee_voucher_history`
--

--
-- AUTO_INCREMENT for table `fee_voucher_history_details`
--

--
-- AUTO_INCREMENT for table `general_settings`
--

--
-- AUTO_INCREMENT for table `goods_requested_process`
--

--
-- AUTO_INCREMENT for table `grading_scales`
--

--
-- AUTO_INCREMENT for table `grading_types`
--

--
-- AUTO_INCREMENT for table `groups`
--

--
-- AUTO_INCREMENT for table `group_categories`
--

--
-- AUTO_INCREMENT for table `group_comments`
--

--
-- AUTO_INCREMENT for table `group_events`
--

--
-- AUTO_INCREMENT for table `group_event_students`
--

--
-- AUTO_INCREMENT for table `guardian_details`
--

--
-- AUTO_INCREMENT for table `hrm_work_weeks`
--

--
-- AUTO_INCREMENT for table `hr_failed_jobs`
--

--
-- AUTO_INCREMENT for table `hr_permissions`
--

--
-- AUTO_INCREMENT for table `hr_roles`
--

--
-- AUTO_INCREMENT for table `idcards`
--

--
-- AUTO_INCREMENT for table `increment_pfs`
--

--
-- AUTO_INCREMENT for table `installment_plans`
--

--
-- AUTO_INCREMENT for table `intake`
--

--
-- AUTO_INCREMENT for table `in_out_logs`
--

--
-- AUTO_INCREMENT for table `job_post`
--

--
-- AUTO_INCREMENT for table `job_post_request`
--

--
-- AUTO_INCREMENT for table `labs`
--

--
-- AUTO_INCREMENT for table `lab_time_table`
--

--
-- AUTO_INCREMENT for table `learner_profiles`
--

--
-- AUTO_INCREMENT for table `leavemanagements`
--

--
-- AUTO_INCREMENT for table `leave_type_staff_types`
--

--
-- AUTO_INCREMENT for table `lecture_base_salarysheet_child_model`
--

--
-- AUTO_INCREMENT for table `lecture_base_salarysheet_parent_model`
--

--
-- AUTO_INCREMENT for table `lessons`
--

--
-- AUTO_INCREMENT for table `library_circulation`
--

--
-- AUTO_INCREMENT for table `library_members`
--

--
-- AUTO_INCREMENT for table `loans`
--

--
-- AUTO_INCREMENT for table `login_detail`
--

--
-- AUTO_INCREMENT for table `login_details`
--

--
-- AUTO_INCREMENT for table `migrations`
--

--
-- AUTO_INCREMENT for table `months`
--

--
-- AUTO_INCREMENT for table `notes`
--

--
-- AUTO_INCREMENT for table `notices`
--

--
-- AUTO_INCREMENT for table `notifications`
--

--
-- AUTO_INCREMENT for table `parent_details`
--

--
-- AUTO_INCREMENT for table `past_paper`
--

--
-- AUTO_INCREMENT for table `payment_methods`
--

--
-- AUTO_INCREMENT for table `payment_settings`
--

--
-- AUTO_INCREMENT for table `payrolls`
--

--
-- AUTO_INCREMENT for table `payroll_employees`
--

--
-- AUTO_INCREMENT for table `permissions`
--

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--

--
-- AUTO_INCREMENT for table `portfolio`
--

--
-- AUTO_INCREMENT for table `portfolio_files`
--

--
-- AUTO_INCREMENT for table `prerequisite`
--

--
-- AUTO_INCREMENT for table `product`
--

--
-- AUTO_INCREMENT for table `products`
--

--
-- AUTO_INCREMENT for table `programs`
--

--
-- AUTO_INCREMENT for table `program_subject`
--

--
-- AUTO_INCREMENT for table `program_term`
--

--
-- AUTO_INCREMENT for table `program_terms`
--

--
-- AUTO_INCREMENT for table `promotion`
--

--
-- AUTO_INCREMENT for table `published_exam`
--

--
-- AUTO_INCREMENT for table `quiz`
--

--
-- AUTO_INCREMENT for table `quizzes`
--

--
-- AUTO_INCREMENT for table `quiz_mark_ledgers`
--

--
-- AUTO_INCREMENT for table `quiz_schedules`
--

--
-- AUTO_INCREMENT for table `quiz_timetables`
--

--
-- AUTO_INCREMENT for table `recruitment_feedback`
--

--
-- AUTO_INCREMENT for table `report_groups`
--

--
-- AUTO_INCREMENT for table `report_parameters`
--

--
-- AUTO_INCREMENT for table `requested_goods_branches`
--

--
-- AUTO_INCREMENT for table `request_approvals`
--

--
-- AUTO_INCREMENT for table `request_loan_employee`
--

--
-- AUTO_INCREMENT for table `residents`
--

--
-- AUTO_INCREMENT for table `resident_histories`
--

--
-- AUTO_INCREMENT for table `resigns`
--

--
-- AUTO_INCREMENT for table `restricted_leave_months`
--

--
-- AUTO_INCREMENT for table `return_policies`
--

--
-- AUTO_INCREMENT for table `roles`
--

--
-- AUTO_INCREMENT for table `rooms`
--

--
-- AUTO_INCREMENT for table `room_types`
--

--
-- AUTO_INCREMENT for table `schedule`
--

--
-- AUTO_INCREMENT for table `sections`
--

--
-- AUTO_INCREMENT for table `semesters`
--

--
-- AUTO_INCREMENT for table `services_type`
--

--
-- AUTO_INCREMENT for table `sessions`
--

--
-- AUTO_INCREMENT for table `shared_todos`
--

--
-- AUTO_INCREMENT for table `sms_settings`
--

--
-- AUTO_INCREMENT for table `sos_staff_history`
--

--
-- AUTO_INCREMENT for table `staff`
--

--
-- AUTO_INCREMENT for table `staff_assets`
--

--
-- AUTO_INCREMENT for table `staff_bank_accounts`
--

--
-- AUTO_INCREMENT for table `staff_basic_information`
--

--
-- AUTO_INCREMENT for table `staff_bi_branches`
--

--
-- AUTO_INCREMENT for table `staff_branches`
--

--
-- AUTO_INCREMENT for table `staff_branch_transfer`
--

--
-- AUTO_INCREMENT for table `staff_emergency_contacts`
--

--
-- AUTO_INCREMENT for table `staff_experiences`
--

--
-- AUTO_INCREMENT for table `staff_families`
--

--
-- AUTO_INCREMENT for table `staff_performances`
--

--
-- AUTO_INCREMENT for table `staff_program_assign`
--

--
-- AUTO_INCREMENT for table `staff_qualifications`
--

--
-- AUTO_INCREMENT for table `staff_student_parents`
--

--
-- AUTO_INCREMENT for table `staff_transfer_branches`
--

--
-- AUTO_INCREMENT for table `staff_type`
--

--
-- AUTO_INCREMENT for table `std_active_s_elecive`
--

--
-- AUTO_INCREMENT for table `std_student_guardians`
--

--
-- AUTO_INCREMENT for table `students`
--

--
-- AUTO_INCREMENT for table `student_attendance_payroll`
--

--
-- AUTO_INCREMENT for table `student_enrollments`
--

--
-- AUTO_INCREMENT for table `student_enrollments_record`
--

--
-- AUTO_INCREMENT for table `student_fee_settings`
--

--
-- AUTO_INCREMENT for table `student_guardians`
--

--
-- AUTO_INCREMENT for table `student_reports`
--

--
-- AUTO_INCREMENT for table `student_report_details`
--

--
-- AUTO_INCREMENT for table `student_sos_details`
--

--
-- AUTO_INCREMENT for table `student_sos_statuses`
--

--
-- AUTO_INCREMENT for table `student_status`
--

--
-- AUTO_INCREMENT for table `student_statuses`
--

--
-- AUTO_INCREMENT for table `student_transfer_history`
--

--
-- AUTO_INCREMENT for table `subject_category_models`
--

--
-- AUTO_INCREMENT for table `subject_details`
--

--
-- AUTO_INCREMENT for table `subject_fee_details`
--

--
-- AUTO_INCREMENT for table `subject_fee_master`
--

--
-- AUTO_INCREMENT for table `subject_type`
--

--
-- AUTO_INCREMENT for table `syllabi`
--

--
-- AUTO_INCREMENT for table `syllabus_heads`
--

--
-- AUTO_INCREMENT for table `tax_managements`
--

--
-- AUTO_INCREMENT for table `tbl_attendance_date`
--

--
-- AUTO_INCREMENT for table `teacher_attendance_payroll`
--

--
-- AUTO_INCREMENT for table `teacher_classes`
--

--
-- AUTO_INCREMENT for table `teacher_student_relation`
--

--
-- AUTO_INCREMENT for table `terminations`
--

--
-- AUTO_INCREMENT for table `terms`
--

--
-- AUTO_INCREMENT for table `tier`
--

--
-- AUTO_INCREMENT for table `timetable_categories`
--

--
-- AUTO_INCREMENT for table `time_tables`
--

--
-- AUTO_INCREMENT for table `time_table_slots`
--

--
-- AUTO_INCREMENT for table `todos`
--

--
-- AUTO_INCREMENT for table `trainees`
--

--
-- AUTO_INCREMENT for table `trainings`
--

--
-- AUTO_INCREMENT for table `transactions`
--

--
-- AUTO_INCREMENT for table `transaction_heads`
--

--
-- AUTO_INCREMENT for table `transfer_state_management`
--

--
-- AUTO_INCREMENT for table `transfer_student_detail`
--

--
-- AUTO_INCREMENT for table `unit_planner`
--

--
-- AUTO_INCREMENT for table `unit_planner_details`
--

--
-- AUTO_INCREMENT for table `uom`
--

--
-- AUTO_INCREMENT for table `uploaded_documents`
--

--
-- AUTO_INCREMENT for table `upload_experience_letters`
--

--
-- AUTO_INCREMENT for table `user`
--

--
-- AUTO_INCREMENT for table `users`
--

--
-- AUTO_INCREMENT for table `user_pemissions`
--

--
-- AUTO_INCREMENT for table `utilitybills`
--

--
-- AUTO_INCREMENT for table `walk_in_registration`
--

--
-- AUTO_INCREMENT for table `weekdays`
--

--
-- AUTO_INCREMENT for table `work_plans`
--

--
-- AUTO_INCREMENT for table `work_plan_details`
--

--
-- AUTO_INCREMENT for table `zkteco_devices`
--

--
-- Constraints for dumped tables
--

--
-- Constraints for table `hr_model_has_permissions`
--
ALTER TABLE "hr_model_has_permissions" ADD CONSTRAINT "hr_model_has_permissions_permission_id_foreign" FOREIGN KEY ("permission_id") REFERENCES "hr_permissions" ("id") ON DELETE CASCADE;

--
-- Constraints for table `hr_model_has_roles`
--
ALTER TABLE "hr_model_has_roles" ADD CONSTRAINT "hr_model_has_roles_role_id_foreign" FOREIGN KEY ("role_id") REFERENCES "hr_roles" ("id") ON DELETE CASCADE;

--
-- Constraints for table `hr_role_has_permissions`
--
ALTER TABLE "hr_role_has_permissions" ADD CONSTRAINT "hr_role_has_permissions_permission_id_foreign" FOREIGN KEY ("permission_id") REFERENCES "hr_permissions" ("id") ON DELETE CASCADE;
ALTER TABLE "hr_role_has_permissions" ADD CONSTRAINT "hr_role_has_permissions_role_id_foreign" FOREIGN KEY ("role_id") REFERENCES "hr_roles" ("id") ON DELETE CASCADE;

--
-- Constraints for table `permission_role`
--
ALTER TABLE "permission_role" ADD CONSTRAINT "permission_role_permission_id_foreign" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "permission_role" ADD CONSTRAINT "permission_role_role_id_foreign" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `permission_user`
--
ALTER TABLE "permission_user" ADD CONSTRAINT "permission_user_permission_id_foreign" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `role_user`
--
ALTER TABLE "role_user" ADD CONSTRAINT "role_user_role_id_foreign" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE;


