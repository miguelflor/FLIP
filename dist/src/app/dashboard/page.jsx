"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardPage;
// src/app/dashboard/page.tsx
const react_1 = __importDefault(require("react"));
const ScheduleCard_1 = __importDefault(require("../../components/ScheduleCard"));
const PDFList_1 = __importDefault(require("../../components/PDFList"));
function DashboardPage() {
    return (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ScheduleCard_1.default />
      <PDFList_1.default />
      {/* Outros blocos podem ser adicionados aqui */}
    </div>);
}
