const d = new Date('2026-08-14');
console.log('Initial:', d.toISOString());
d.setMonth(d.getMonth() - 11);
console.log('After setMonth(-11):', d.toISOString());
d.setDate(1);
console.log('After setDate(1):', d.toISOString());
d.setHours(0, 0, 0, 0);
console.log('After setHours:', d.toISOString());
