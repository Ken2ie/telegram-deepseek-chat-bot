const validator = require('../../src/utils/validator');

describe('Validator', () => {
  describe('isValidPhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(validator.isValidPhoneNumber('1234567890')).toBe(true);
      expect(validator.isValidPhoneNumber('+1234567890')).toBe(true);
      expect(validator.isValidPhoneNumber('+1-234-567-8900')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validator.isValidPhoneNumber('123')).toBe(false);
      expect(validator.isValidPhoneNumber('abc')).toBe(false);
      expect(validator.isValidPhoneNumber('')).toBe(false);
    });
  });

  describe('isValidTime', () => {
    it('should validate correct time formats', () => {
      expect(validator.isValidTime('10:30 AM')).toBe(true);
      expect(validator.isValidTime('2:00 PM')).toBe(true);
      expect(validator.isValidTime('14:30')).toBe(true);
    });

    it('should reject invalid time formats', () => {
      expect(validator.isValidTime('25:00')).toBe(false);
      expect(validator.isValidTime('abc')).toBe(false);
      expect(validator.isValidTime('')).toBe(false);
    });
  });

  describe('isValidDay', () => {
    it('should validate correct days', () => {
      expect(validator.isValidDay('Monday')).toBe(true);
      expect(validator.isValidDay('monday')).toBe(true);
      expect(validator.isValidDay('FRIDAY')).toBe(true);
    });

    it('should reject invalid days', () => {
      expect(validator.isValidDay('Saturday')).toBe(false);
      expect(validator.isValidDay('Sunday')).toBe(false);
      expect(validator.isValidDay('abc')).toBe(false);
    });
  });

  describe('isWithinBusinessHours', () => {
    it('should validate business hours', () => {
      expect(validator.isWithinBusinessHours('10:30 AM')).toBe(true);
      expect(validator.isWithinBusinessHours('2:00 PM')).toBe(true);
      expect(validator.isWithinBusinessHours('9:00 AM')).toBe(true);
    });

    it('should reject non-business hours', () => {
      expect(validator.isWithinBusinessHours('8:00 AM')).toBe(false);
      expect(validator.isWithinBusinessHours('5:00 PM')).toBe(false);
      expect(validator.isWithinBusinessHours('12:00 AM')).toBe(false);
    });
  });
});
