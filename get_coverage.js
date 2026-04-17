const fs = require('fs');

async function test() {
    const { fetchActivity } = await import('./src/lib/github.ts');
    console.log(fetchActivity);
}
