"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentAcademicYear = void 0;
/**
 *
 * @returns The current academic year as a string.
 */
const getCurrentAcademicYear = () => {
    const now = new Date();
    return (now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear()).toString();
};
exports.getCurrentAcademicYear = getCurrentAcademicYear;
