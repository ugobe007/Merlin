import { sum } from '../sum';

describe('sum function', () => {
    it('should return the sum of two numbers', () => {
        expect(sum(1, 2)).toBe(3);
    });

    it('should return 0 when adding 0 and 0', () => {
        expect(sum(0, 0)).toBe(0);
    });

    it('should return a negative number when adding a positive and a negative number', () => {
        expect(sum(-1, 1)).toBe(0);
    });
});