# Universal SaaS POS + ERP — Industry ERP Modules Guide

## 1. Restaurant & Table Management + KDS

### Core Features (`restaurant.core`, `restaurant.kitchenDisplay`)
- **Floor Plan & Dining Tables**: Interactive floor layout showing real-time occupancy status (`available`, `occupied`, `reserved`).
- **Waiter Ordering**: Staff can take customer orders at tables, assigning dish items, special preparation notes, and seat positions. Placing an order marks the table as occupied.
- **Kitchen Display System (KDS)**: High-contrast order board for chefs and kitchen staff. Orders automatically flow through states: `placed` -> `preparing` -> `ready` -> `served`.
- **Table Release**: Processing final payment automatically frees the dining table back to `available`.

---

## 2. Service Center & Electronics Repair

### Core Features (`repairs.jobCards`)
- **Diagnostic Job Cards**: Track incoming devices (smartphones, laptops, machinery) with customer contact details, device make/model, serial/IMEI numbers, and reported defects.
- **Cost Estimation**: Distinct tracking of labor costs and spare part prices.
- **Inventory Integration**: When a technician moves a repair job card to `completed`, selected spare parts are automatically deducted from the product inventory balance, and an adjustment log is created in `inventory_logs`.
- **Progress Tracking**: Clear status progression (`received`, `repairing`, `completed`, `delivered`).

---

## 3. Salon & Aesthetics Appointments

### Core Features (`salon.appointments`)
- **Stylist Directory**: Manage beauty therapists, hair stylists, and nail technicians with specializations.
- **Services Catalog**: Service menu with duration in minutes and prices.
- **Booking Conflict Prevention**: Server-side validation guarantees that a stylist cannot be double-booked for overlapping time slots on the same date. Conflicting booking requests are rejected with HTTP 409 Conflict.
- **Appointment Statuses**: `confirmed` -> `in_progress` -> `completed` / `cancelled`.

---

## 4. HRM & Employee Attendance & Payroll

### Core Features (`hrm.core`, `hrm.payroll`)
- **Staff Directory**: Employee records including departments, job roles, contact details, and base salary structures.
- **Daily Attendance**: Clock-in and clock-out logging with status flags (`present`, `late`, `half_day`, `absent`).
- **Monthly Payroll Processing**: Authoritative decimal-safe net salary calculation factoring in base pay, overtime/bonuses, and deductions.
- **Salary Disbursement**: Track draft salary slips and mark as `paid` with audit timestamps.

