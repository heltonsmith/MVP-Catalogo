import { titleCase, cleanTextInput } from './src/utils/index.js';

const tests = [
    { input: '  helton bustos  ', expected: 'Helton Bustos' },
    { input: 'HElton BUSTOS', expected: 'Helton Bustos' },
    { input: 'tienda de prueba 123', expected: 'Tienda De Prueba 123' },
    { input: 'el sol 77, maipú', expected: 'El Sol 77, Maipú' },
    { input: '  a  b  c  ', expected: 'A B C' },
    { input: '', expected: '' },
    { input: null, expected: '' }
];

console.log('Testing TitleCase:');
tests.forEach(({ input, expected }) => {
    const result = titleCase(input);
    console.log(`Input: "${input}" -> Result: "${result}" [${result === expected ? 'PASS' : 'FAIL'}]`);
});

console.log('\nTesting cleanTextInput (limit 5):');
const longInput = 'this is a long string';
const cleanResult = cleanTextInput(longInput, 5);
console.log(`Input: "${longInput}" -> Result: "${cleanResult}" [${cleanResult === 'this ' ? 'PASS' : 'FAIL'}]`);
