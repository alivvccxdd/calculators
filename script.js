// ============================================
// المحرك الأساسي
// ============================================

class CalculatorEngine {
    constructor() {
        this.memory = 0;
        this.history = [];
        this.variables = {};
        this.angleMode = 'DEG';
        this.precision = 12;
        this.steps = [];
        this.result = null;
    }

    evaluate(expr) {
        this.steps = [];
        this.result = null;
        
        try {
            let e = expr
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-')
                .replace(/π/g, 'pi')
                .replace(/e(?![xp])/g, '2.718281828459045');
            
            // استبدال المتغيرات
            for (const [key, value] of Object.entries(this.variables)) {
                e = e.replace(new RegExp(`\\b${key}\\b`, 'g'), `(${value})`);
            }
            
            // معالجة الدوال
            e = e.replace(/√\(/g, 'sqrt(');
            e = e.replace(/abs\(/g, 'abs(');
            e = e.replace(/sin\(/g, 'sin(');
            e = e.replace(/cos\(/g, 'cos(');
            e = e.replace(/tan\(/g, 'tan(');
            e = e.replace(/log\(/g, 'log(');
            e = e.replace(/ln\(/g, 'ln(');
            e = e.replace(/sinh\(/g, 'sinh(');
            e = e.replace(/cosh\(/g, 'cosh(');
            e = e.replace(/tanh\(/g, 'tanh(');
            e = e.replace(/asin\(/g, 'asin(');
            e = e.replace(/acos\(/g, 'acos(');
            e = e.replace(/atan\(/g, 'atan(');
            e = e.replace(/exp\(/g, 'exp(');
            e = e.replace(/10\^\(/g, '10^(');
            
            // معالجة الأسس
            e = e.replace(/(\d+)\^(\d+)/g, (m, base, exp) => `pow(${base},${exp})`);
            e = e.replace(/10\^\(([^)]+)\)/g, (m, exp) => `pow(10,${exp})`);
            
            // معالجة المضروب
            e = e.replace(/(\d+)!/g, (m, n) => `factorial(${n})`);
            
            // معالجة 1/x
            e = e.replace(/1\/\(/g, '1/(');
            
            this.addStep('المعادلة', expr);
            this.addStep('بعد التنظيف', e);
            
            const result = math.evaluate(e);
            this.result = result;
            
            if (typeof result === 'number') {
                this.addStep('النتيجة', this.formatNumber(result));
                return { result: this.formatNumber(result), steps: this.steps };
            }
            
            return { result: result, steps: this.steps };
            
        } catch (error) {
            this.addStep('خطأ', error.message);
            return { error: error.message, steps: this.steps };
        }
    }

    formatNumber(num) {
        if (num === 0) return '0';
        if (num === Infinity) return '∞';
        if (isNaN(num)) return 'NaN';
        
        if (Math.abs(num) > 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
            return num.toExponential(6);
        }
        
        return parseFloat(num.toPrecision(this.precision)).toString();
    }

    addStep(label, value) {
        this.steps.push({ label, value });
    }

    memory(action, value) {
        switch(action) {
            case 'MC': this.memory = 0; break;
            case 'MR': return this.memory;
            case 'M+': this.memory += value; break;
            case 'M-': this.memory -= value; break;
            case 'MS': this.memory = value; break;
        }
        return this.memory;
    }

    setAngleMode(mode) {
        this.angleMode = mode;
        document.getElementById('displayAngle').textContent = mode;
        math.config({ angle: mode.toLowerCase() });
    }

    setPrecision(precision) {
        this.precision = Math.max(1, Math.min(20, precision));
        document.getElementById('precisionDisplay').textContent = precision;
    }

    addHistory(entry) {
        this.history.unshift(entry);
        if (this.history.length > 100) this.history.pop();
    }

    clearHistory() {
        this.history = [];
    }

    addVariable(name, value) {
        this.variables[name] = value;
    }

    removeVariable(name) {
        delete this.variables[name];
    }
}

// ============================================
// دوال مساعدة
// ============================================

function factorial(n) {
    if (n < 0) return Infinity;
    if (n <= 1) return 1;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
}

function sin(x) {
    return math.sin(engine.angleMode === 'DEG' ? x * Math.PI / 180 : x);
}

function cos(x) {
    return math.cos(engine.angleMode === 'DEG' ? x * Math.PI / 180 : x);
}

function tan(x) {
    return math.tan(engine.angleMode === 'DEG' ? x * Math.PI / 180 : x);
}

// تسجيل الدوال المخصصة
math.import({
    factorial: factorial,
    sin: sin,
    cos: cos,
    tan: tan,
    pi: Math.PI,
    e: Math.E,
    exp: Math.exp
}, { override: true });

// ============================================
// المحرك العالمي
// ============================================

const engine = new CalculatorEngine();

// ============================================
// دوال الإحصاء والاحتمالات
// ============================================

const Statistics = {
    mean: (data) => data.reduce((a, b) => a + b, 0) / data.length,
    
    median: (data) => {
        const sorted = [...data].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    },
    
    mode: (data) => {
        const freq = {};
        data.forEach(v => freq[v] = (freq[v] || 0) + 1);
        const max = Math.max(...Object.values(freq));
        return Object.keys(freq).filter(k => freq[k] === max).map(Number);
    },
    
    variance: (data, sample = false) => {
        const mean = Statistics.mean(data);
        const sum = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
        return sum / (sample ? data.length - 1 : data.length);
    },
    
    stdDev: (data, sample = false) => Math.sqrt(Statistics.variance(data, sample)),
    
    range: (data) => Math.max(...data) - Math.min(...data),
    
    iqr: (data) => {
        const sorted = [...data].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        return q3 - q1;
    },
    
    skewness: (data) => {
        const mean = Statistics.mean(data);
        const std = Statistics.stdDev(data);
        if (std === 0) return 0;
        const n = data.length;
        const sum = data.reduce((a, b) => a + Math.pow((b - mean) / std, 3), 0);
        return sum * n / ((n - 1) * (n - 2));
    },
    
    kurtosis: (data) => {
        const mean = Statistics.mean(data);
        const std = Statistics.stdDev(data);
        if (std === 0) return 0;
        const n = data.length;
        const sum = data.reduce((a, b) => a + Math.pow((b - mean) / std, 4), 0);
        return (sum * n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) - (3 * Math.pow(n - 1, 2) / ((n - 2) * (n - 3)));
    },
    
    binomial: (n, k, p) => {
        if (k < 0 || k > n) return 0;
        const comb = math.combinations(n, k);
        return comb * Math.pow(p, k) * Math.pow(1 - p, n - k);
    },
    
    poisson: (lambda, k) => {
        if (lambda <= 0 || k < 0) return 0;
        return Math.pow(lambda, k) * Math.exp(-lambda) / math.factorial(k);
    },
    
    normal: (x, mean, std) => {
        if (std <= 0) return 0;
        return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-Math.pow(x - mean, 2) / (2 * std * std));
    },
    
    normalCDF: (x, mean, std) => {
        if (std <= 0) return 0;
        return 0.5 * (1 + erf((x - mean) / (std * Math.sqrt(2))));
    },
    
    exponential: (x, lambda) => {
        if (lambda <= 0 || x < 0) return 0;
        return lambda * Math.exp(-lambda * x);
    },
    
    exponentialCDF: (x, lambda) => {
        if (lambda <= 0 || x < 0) return 0;
        return 1 - Math.exp(-lambda * x);
    },
    
    geometric: (p, k) => {
        if (p < 0 || p > 1 || k < 1) return 0;
        return Math.pow(1 - p, k - 1) * p;
    },
    
    uniform: (x, a, b) => {
        if (a >= b || x < a || x > b) return 0;
        return 1 / (b - a);
    }
};

function erf(x) {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1 / (1 + p * x);
    const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}

// ============================================
// دوال المصفوفات
// ============================================

function matrixAdd(a, b) {
    if (!a || !b) return null;
    const rows = a.length, cols = a[0].length;
    const result = [];
    for (let i = 0; i < rows; i++) {
        result[i] = [];
        for (let j = 0; j < cols; j++) {
            result[i][j] = a[i][j] + b[i][j];
        }
    }
    return result;
}

function matrixSubtract(a, b) {
    if (!a || !b) return null;
    const rows = a.length, cols = a[0].length;
    const result = [];
    for (let i = 0; i < rows; i++) {
        result[i] = [];
        for (let j = 0; j < cols; j++) {
            result[i][j] = a[i][j] - b[i][j];
        }
    }
    return result;
}

function matrixMultiply(a, b) {
    if (!a || !b) return null;
    const rowsA = a.length, colsA = a[0].length, colsB = b[0].length;
    const result = Array.from({ length: rowsA }, () => Array(colsB).fill(0));
    for (let i = 0; i < rowsA; i++) {
        for (let j = 0; j < colsB; j++) {
            for (let k = 0; k < colsA; k++) {
                result[i][j] += a[i][k] * b[k][j];
            }
        }
    }
    return result;
}

function matrixTranspose(a) {
    if (!a) return null;
    const rows = a.length, cols = a[0].length;
    const result = [];
    for (let j = 0; j < cols; j++) {
        result[j] = [];
        for (let i = 0; i < rows; i++) {
            result[j][i] = a[i][j];
        }
    }
    return result;
}

function matrixDeterminant(a) {
    if (!a) return null;
    const n = a.length;
    if (n === 1) return a[0][0];
    if (n === 2) return a[0][0] * a[1][1] - a[0][1] * a[1][0];
    let det = 0;
    for (let i = 0; i < n; i++) {
        const sub = [];
        for (let j = 1; j < n; j++) {
            sub[j - 1] = [];
            for (let k = 0; k < n; k++) {
                if (k === i) continue;
                sub[j - 1].push(a[j][k]);
            }
        }
        det += (i % 2 === 0 ? 1 : -1) * a[0][i] * matrixDeterminant(sub);
    }
    return det;
}

function matrixInverse(a) {
    const det = matrixDeterminant(a);
    if (det === 0) return null;
    const n = a.length;
    const adj = [];
    for (let i = 0; i < n; i++) {
        adj[i] = [];
        for (let j = 0; j < n; j++) {
            const sub = [];
            for (let k = 0; k < n; k++) {
                if (k === i) continue;
                const row = [];
                for (let l = 0; l < n; l++) {
                    if (l === j) continue;
                    row.push(a[k][l]);
                }
                sub.push(row);
            }
            adj[j][i] = Math.pow(-1, i + j) * matrixDeterminant(sub);
        }
    }
    return adj.map(row => row.map(v => v / det));
}

function matrixRank(a) {
    if (!a) return null;
    const m = a.length,
        n = a[0].length;
    const mat = a.map(row => [...row]);
    let rank = 0;
    let row = 0;
    for (let col = 0; col < n && row < m; col++) {
        let pivot = null;
        for (let i = row; i < m; i++) {
            if (mat[i][col] !== 0) { pivot = i; break; }
        }
        if (pivot === null) continue;
        [mat[row], mat[pivot]] = [mat[pivot], mat[row]];
        const pivotVal = mat[row][col];
        for (let j = col; j < n; j++) mat[row][j] /= pivotVal;
        for (let i = 0; i < m; i++) {
            if (i !== row) {
                const factor = mat[i][col];
                for (let j = col; j < n; j++) {
                    mat[i][j] -= factor * mat[row][j];
                }
            }
        }
        rank++;
        row++;
    }
    return rank;
}

function matrixTrace(a) {
    if (!a) return null;
    let trace = 0;
    for (let i = 0; i < Math.min(a.length, a[0].length); i++) {
        trace += a[i][i];
    }
    return trace;
}

function matrixEigenvalues(a) {
    if (a.length !== 2 || a[0].length !== 2) return null;
    const [a11, a12, a21, a22] = [a[0][0], a[0][1], a[1][0], a[1][1]];
    const trace = a11 + a22;
    const det = a11 * a22 - a12 * a21;
    const disc = trace * trace - 4 * det;
    if (disc < 0) {
        return { real: trace / 2, imag: Math.sqrt(-disc) / 2 };
    }
    return { λ1: (trace + Math.sqrt(disc)) / 2, λ2: (trace - Math.sqrt(disc)) / 2 };
}

// ============================================
// دوال نظرية الأعداد
// ============================================

const NumberTheory = {
    isPrime: (n) => {
        if (n < 2) return false;
        if (n % 2 === 0) return n === 2;
        for (let i = 3; i * i <= n; i += 2) {
            if (n % i === 0) return false;
        }
        return true;
    },

    primeFactors: (n) => {
        const factors = [];
        let num = n;
        for (let i = 2; i * i <= num; i++) {
            while (num % i === 0) {
                factors.push(i);
                num /= i;
            }
        }
        if (num > 1) factors.push(num);
        return factors;
    },

    divisors: (n) => {
        const divs = [];
        for (let i = 1; i <= Math.sqrt(n); i++) {
            if (n % i === 0) {
                divs.push(i);
                if (i !== n / i) divs.push(n / i);
            }
        }
        return divs.sort((a, b) => a - b);
    },

    gcd: (a, b) => {
        while (b !== 0) {
            const t = b;
            b = a % b;
            a = t;
        }
        return Math.abs(a);
    },

    lcm: (a, b) => a === 0 || b === 0 ? 0 : Math.abs(a * b) / NumberTheory.gcd(a, b),

    isPerfect: (n) => {
        if (n < 2) return false;
        const sum = NumberTheory.divisors(n).reduce((a, b) => a + b, 0) - n;
        return sum === n;
    },

    phi: (n) => {
        let result = n;
        let num = n;
        for (let i = 2; i * i <= num; i++) {
            if (num % i === 0) {
                while (num % i === 0) num /= i;
                result -= result / i;
            }
        }
        if (num > 1) result -= result / num;
        return result;
    },

    modInverse: (a, mod) => {
        const gcd = NumberTheory.extendedGCD(a, mod);
        if (gcd[0] !== 1) return null;
        return ((gcd[1] % mod) + mod) % mod;
    },

    extendedGCD: (a, b) => {
        if (b === 0) return [a, 1, 0];
        const [g, x1, y1] = NumberTheory.extendedGCD(b, a % b);
        return [g, y1, x1 - Math.floor(a / b) * y1];
    }
};

// ============================================
// دوال الأعداد المركبة
// ============================================

function complexAdd(a, b) { return { r: a.r + b.r, i: a.i + b.i }; }

function complexSub(a, b) { return { r: a.r - b.r, i: a.i - b.i }; }

function complexMul(a, b) { return { r: a.r * b.r - a.i * b.i, i: a.r * b.i + a.i * b.r }; }

function complexDiv(a, b) {
    const d = b.r * b.r + b.i * b.i;
    if (d === 0) return { r: Infinity, i: Infinity };
    return { r: (a.r * b.r + a.i * b.i) / d, i: (a.i * b.r - a.r * b.i) / d };
}

function complexMod(a) { return Math.sqrt(a.r * a.r + a.i * a.i); }

function complexArg(a) { return Math.atan2(a.i, a.r); }

function complexConj(a) { return { r: a.r, i: -a.i }; }

function complexPow(a, n) {
    const r = complexMod(a);
    const theta = complexArg(a);
    return { r: Math.pow(r, n) * Math.cos(n * theta), i: Math.pow(r, n) * Math.sin(n * theta) };
}

// ============================================
// دوال التحويل
// ============================================

const UnitConverter = {
    categories: {
        length: { meter: 1, kilometer: 1000, centimeter: 0.01, millimeter: 0.001, mile: 1609.344, yard: 0.9144,
            foot: 0.3048, inch: 0.0254 },
        mass: { kilogram: 1, gram: 0.001, milligram: 0.000001, pound: 0.453592, ounce: 0.0283495, ton: 1000 },
        temperature: {},
        area: { square_meter: 1, square_kilometer: 1000000, hectare: 10000, acre: 4046.86, square_foot: 0.092903 },
        volume: { liter: 1, milliliter: 0.001, cubic_meter: 1000, gallon_us: 3.78541, gallon_uk: 4.54609 },
        speed: { kmh: 1, ms: 3.6, mph: 1.60934, knot: 1.852 },
        time: { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, month: 2592000, year: 31536000 },
        data: { bit: 1, byte: 8, kilobyte: 8000, megabyte: 8000000, gigabyte: 8000000000 },
        pressure: { pascal: 1, kilopascal: 1000, bar: 100000, atmosphere: 101325, psi: 6894.76 },
        energy: { joule: 1, kilojoule: 1000, calorie: 4.184, kilocalorie: 4184, watt_hour: 3600 },
        power: { watt: 1, kilowatt: 1000, megawatt: 1000000, horsepower: 745.7 },
        angle: { degree: 1, radian: 57.2958, gradian: 0.9 }
    },

    convert: function(value, from, to, category) {
        if (category === 'temperature') {
            const conv = {
                celsius: { fahrenheit: v => v * 9 / 5 + 32, kelvin: v => v + 273.15 },
                fahrenheit: { celsius: v => (v - 32) * 5 / 9, kelvin: v => (v - 32) * 5 / 9 + 273.15 },
                kelvin: { celsius: v => v - 273.15, fahrenheit: v => (v - 273.15) * 9 / 5 + 32 }
            };
            if (conv[from] && conv[from][to]) return conv[from][to](value);
            return value;
        }
        const units = this.categories[category];
        if (!units || !units[from] || !units[to]) return null;
        return (value * units[from]) / units[to];
    },

    getUnits: function(category) {
        if (category === 'temperature') return ['celsius', 'fahrenheit', 'kelvin'];
        return Object.keys(this.categories[category] || {});
    },

    getCategories: function() {
        return ['length', 'mass', 'temperature', 'area', 'volume', 'speed', 'time', 'data', 'pressure', 'energy', 'power',
            'angle'
        ];
    }
};

// ============================================
// دوال التحكم الرئيسية
// ============================================

let currentMode = 'basic';
let currentTab = 'calculator';
let historyVisible = true;
let graphEngine = null;

// تبديل الوضع
function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.nav-btn[data-mode]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    document.querySelectorAll('.mode-content').forEach(el => {
        el.classList.toggle('active', el.id === `mode-${mode}`);
    });
    const names = {
        basic: 'قياسي',
        scientific: 'علمي',
        graph: 'رسم بياني',
        matrix: 'مصفوفات',
        statistics: 'إحصاء',
        converter: 'تحويل',
        number: 'نظرية أعداد',
        complex: 'أعداد مركبة'
    };
    document.getElementById('displayMode').textContent = names[mode] || mode;

    if (mode === 'graph') {
        setTimeout(() => {
            if (!graphEngine) {
                graphEngine = new GraphingEngine('graphContainer');
                graphEngine.addFunction('x^2');
            }
        }, 100);
    }
}

// تبديل التبويب
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.includes(
            tab === 'calculator' ? 'حاسبة' :
            tab === 'advanced' ? 'متقدم' : 'معادلات'
        ));
    });
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.toggle('active', el.id === `tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    });
}

// الإدخال
function input(value) {
    const display = document.getElementById('expressionDisplay');
    const resultDisplay = document.getElementById('resultDisplay');
    const stepsDisplay = document.getElementById('stepsDisplay');

    if (resultDisplay.textContent !== '0' && resultDisplay.textContent !== '' && !resultDisplay.classList.contains(
            'error')) {
        display.textContent = '';
        resultDisplay.textContent = '0';
        stepsDisplay.style.display = 'none';
    }

    let current = display.textContent;
    const val = value === '×' ? '*' :
        value === '÷' ? '/' :
        value === '−' ? '-' : value;

    display.textContent = current + val;
    resultDisplay.className = 'result-display';
}

// تبديل الإشارة
function toggleSign() {
    const display = document.getElementById('expressionDisplay');
    const current = display.textContent;
    if (current.startsWith('-')) {
        display.textContent = current.substring(1);
    } else if (current && current !== '0') {
        display.textContent = '-' + current;
    }
}

// الحساب
function calculate() {
    const display = document.getElementById('expressionDisplay');
    const resultDisplay = document.getElementById('resultDisplay');
    const stepsDisplay = document.getElementById('stepsDisplay');
    const expr = display.textContent;

    if (!expr || expr.trim() === '') {
        resultDisplay.textContent = '⚠️ أدخل عملية';
        resultDisplay.className = 'result-display error';
        return;
    }

    const result = engine.evaluate(expr);

    if (result.error) {
        resultDisplay.textContent = '⚠️ ' + result.error;
        resultDisplay.className = 'result-display error';
        return;
    }

    resultDisplay.textContent = result.result;
    resultDisplay.className = 'result-display';

    if (result.steps && result.steps.length > 1) {
        stepsDisplay.style.display = 'block';
        stepsDisplay.innerHTML = result.steps.map((step, i) =>
            `<div class="step">
                <span class="step-num">${i+1}.</span>
                <span class="step-label">${step.label}</span>
                <span class="step-value">${step.value}</span>
            </div>`
        ).join('');
    } else {
        stepsDisplay.style.display = 'none';
    }

    engine.addHistory({ expression: expr, result: result.result });
    updateHistory();
    display.textContent = result.result;
}

// مسح
function clearAll() {
    document.getElementById('expressionDisplay').textContent = '';
    document.getElementById('resultDisplay').textContent = '0';
    document.getElementById('resultDisplay').className = 'result-display';
    document.getElementById('stepsDisplay').style.display = 'none';
}

// الذاكرة
function memory(action) {
    const display = document.getElementById('expressionDisplay');
    const value = parseFloat(display.textContent) || 0;
    const result = engine.memory(action, value);
    if (action === 'MR') {
        document.getElementById('resultDisplay').textContent = result;
        display.textContent = result;
    }
}

// وضع الزاوية
function setAngleMode(mode) {
    document.querySelectorAll('.opt-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === mode);
    });
    engine.setAngleMode(mode);
}

// الثيم
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const btn = document.querySelector('.nav-settings .header-btn:first-child');
    btn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
}

// الشاشة الكاملة
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// السجل
function updateHistory() {
    const list = document.getElementById('historyList');
    const count = document.getElementById('historyCount');
    count.textContent = engine.history.length;

    if (engine.history.length === 0) {
        list.innerHTML = '<div class="history-empty">✨ لا توجد عمليات</div>';
        return;
    }

    list.innerHTML = engine.history.map(entry =>
        `<div class="history-item" onclick="useHistory('${entry.expression.replace(/'/g, "\\'")}')">
            <div class="expr">${entry.expression}</div>
            <div class="result">= ${entry.result}</div>
        </div>`
    ).join('');
}

function useHistory(expr) {
    document.getElementById('expressionDisplay').textContent = expr;
    document.getElementById('resultDisplay').textContent = '0';
    calculate();
}

function clearHistory() {
    engine.clearHistory();
    updateHistory();
}

function exportHistory() {
    if (engine.history.length === 0) {
        alert('لا توجد عمليات لتصديرها');
        return;
    }
    const text = engine.history.map(e => `${e.expression} = ${e.result}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'history.txt';
    link.click();
}

function toggleHistory() {
    const sidebar = document.getElementById('historySidebar');
    historyVisible = !historyVisible;
    sidebar.style.display = historyVisible ? 'flex' : 'none';
}

// ============================================
// دوال الرسم البياني
// ============================================

class GraphingEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.functions = [];
        this.xRange = [-10, 10];
        this.colors = ['#0078FF', '#FF3B30', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#00C7BE', '#FF6B6B'];
        this.colorIndex = 0;
    }

    addFunction(func, color = null) {
        this.functions.push({
            func: func,
            color: color || this.colors[this.colorIndex++ % this.colors.length]
        });
        this.render();
    }

    clear() {
        this.functions = [];
        this.colorIndex = 0;
        Plotly.purge(this.container);
    }

    render() {
        const traces = [];
        this.functions.forEach(f => {
            const points = this.generatePoints(f.func);
            if (points.length > 0) {
                traces.push({
                    x: points.map(p => p.x),
                    y: points.map(p => p.y),
                    mode: 'lines',
                    name: f.func,
                    line: { color: f.color, width: 2 }
                });
            }
        });

        if (traces.length === 0) {
            Plotly.purge(this.container);
            return;
        }

        const layout = {
            xaxis: { title: 'x', zeroline: true, gridcolor: 'var(--border)' },
            yaxis: { title: 'f(x)', zeroline: true, gridcolor: 'var(--border)' },
            hovermode: 'closest',
            showlegend: true,
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: 'var(--text)' },
            margin: { l: 50, r: 20, t: 30, b: 50 }
        };

        Plotly.newPlot(this.container, traces, layout, { responsive: true });
    }

    generatePoints(func, steps = 300) {
        const points = [];
        const step = (this.xRange[1] - this.xRange[0]) / steps;
        for (let x = this.xRange[0]; x <= this.xRange[1]; x += step) {
            try {
                const y = math.evaluate(func, { x: x });
                if (isFinite(y) && !isNaN(y)) {
                    points.push({ x, y });
                }
            } catch (e) {}
        }
        return points;
    }

    zoom(factor) {
        const center = (this.xRange[0] + this.xRange[1]) / 2;
        const range = (this.xRange[1] - this.xRange[0]) / 2;
        this.xRange = [center - range / factor, center + range / factor];
        this.render();
    }

    reset() {
        this.xRange = [-10, 10];
        this.render();
    }

    findRoots() {
        const results = [];
        this.functions.forEach(f => {
            const points = this.generatePoints(f.func);
            for (let i = 1; i < points.length; i++) {
                if (points[i - 1].y * points[i].y < 0) {
                    const x = (points[i - 1].x + points[i].x) / 2;
                    results.push({ func: f.func, root: x });
                }
            }
        });
        return results;
    }

    findExtrema() {
        const results = [];
        this.functions.forEach(f => {
            try {
                const derivative = math.derivative(f.func, 'x');
                const criticalPoints = math.solve(derivative + ' = 0', 'x');
                criticalPoints.forEach(x => {
                    if (typeof x === 'number' && x >= this.xRange[0] && x <= this.xRange[1]) {
                        const y = math.evaluate(f.func, { x: x });
                        results.push({ func: f.func, x: x, y: y });
                    }
                });
            } catch (e) {}
        });
        return results;
    }

    getDerivative() {
        if (this.functions.length === 0) return null;
        try {
            const derivative = math.derivative(this.functions[0].func, 'x');
            return derivative.toString();
        } catch (e) {
            return null;
        }
    }
}

function plotGraph() {
    const func1 = document.getElementById('graphFunc').value;
    const func2 = document.getElementById('graphFunc2').value;
    if (!func1 && !func2) return;

    if (!graphEngine) {
        graphEngine = new GraphingEngine('graphContainer');
    }
    graphEngine.clear();
    if (func1) graphEngine.addFunction(func1);
    if (func2) graphEngine.addFunction(func2);
}

function clearGraph() {
    if (graphEngine) {
        graphEngine.clear();
    }
    document.getElementById('graphFunc').value = 'x^2';
    document.getElementById('graphFunc2').value = '';
}

function graphZoom(direction) {
    if (!graphEngine) return;
    graphEngine.zoom(direction === 'in' ? 1.5 : 0.75);
}

function graphReset() {
    if (!graphEngine) return;
    graphEngine.reset();
}

function graphFindRoots() {
    if (!graphEngine) return;
    const roots = graphEngine.findRoots();
    if (roots.length === 0) {
        alert('لا توجد جذور في النطاق الحالي');
        return;
    }
    alert('📍 الجذور:\n' + roots.map(r => `${r.func} → x = ${r.root.toFixed(4)}`).join('\n'));
}

function graphFindExtrema() {
    if (!graphEngine) return;
    const extrema = graphEngine.findExtrema();
    if (extrema.length === 0) {
        alert('لا توجد نقاط حرجة في النطاق الحالي');
        return;
    }
    alert('📈 النقاط الحرجة:\n' + extrema.map(p =>
        `${p.func} → (${p.x.toFixed(4)}, ${p.y.toFixed(4)})`
    ).join('\n'));
}

function graphDerivative() {
    if (!graphEngine) return;
    const derivative = graphEngine.getDerivative();
    if (!derivative) {
        alert('لا يمكن حساب المشتقة');
        return;
    }
    graphEngine.addFunction(derivative, '#FF6B6B');
    alert('📐 تم رسم المشتقة: ' + derivative);
}

// ============================================
// دوال المصفوفات
// ============================================

function createMatrix() {
    const rows = parseInt(document.getElementById('matrixRows').value) || 3;
    const cols = parseInt(document.getElementById('matrixCols').value) || 3;
    const container = document.getElementById('matrixContainer');

    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${cols}, auto)`;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'matrix-cell';
            input.dataset.row = i;
            input.dataset.col = j;
            input.value = i === j ? '1' : '0';
            container.appendChild(input);
        }
    }
    document.getElementById('matrixResult').innerHTML = '';
}

function randomMatrix() {
    const inputs = document.querySelectorAll('#matrixContainer .matrix-cell');
    inputs.forEach(input => {
        input.value = Math.round((Math.random() - 0.5) * 10);
        if (input.value === '0') input.value = Math.round(Math.random() * 5) + 1;
    });
}

function getMatrix() {
    const inputs = document.querySelectorAll('#matrixContainer .matrix-cell');
    const rows = parseInt(document.getElementById('matrixRows').value) || 3;
    const cols = parseInt(document.getElementById('matrixCols').value) || 3;
    const matrix = [];
    let idx = 0;
    for (let i = 0; i < rows; i++) {
        matrix[i] = [];
        for (let j = 0; j < cols; j++) {
            matrix[i][j] = parseFloat(inputs[idx].value) || 0;
            idx++;
        }
    }
    return matrix;
}

function getMatrix2() {
    // للمصفوفة الثانية (نفس الحجم)
    const inputs = document.querySelectorAll('#matrixContainer .matrix-cell');
    const rows = parseInt(document.getElementById('matrixRows').value) || 3;
    const cols = parseInt(document.getElementById('matrixCols').value) || 3;
    const matrix = [];
    let idx = 0;
    for (let i = 0; i < rows; i++) {
        matrix[i] = [];
        for (let j = 0; j < cols; j++) {
            // محاكاة مصفوفة ثانية
            matrix[i][j] = parseFloat(inputs[idx].value) * 0.5 + 1 || 0;
            idx++;
        }
    }
    return matrix;
}

function matrixOperation(op) {
    const matrix = getMatrix();
    const resultDiv = document.getElementById('matrixResult');
    let result;
    let label;

    try {
        switch (op) {
            case 'add':
                const m2 = getMatrix2();
                result = matrixAdd(matrix, m2);
                label = 'جمع المصفوفات';
                break;
            case 'subtract':
                const m2s = getMatrix2();
                result = matrixSubtract(matrix, m2s);
                label = 'طرح المصفوفات';
                break;
            case 'multiply':
                const m2m = getMatrix2();
                result = matrixMultiply(matrix, m2m);
                label = 'ضرب المصفوفات';
                break;
            case 'transpose':
                result = matrixTranspose(matrix);
                label = 'منقولة المصفوفة';
                break;
            case 'determinant':
                result = matrixDeterminant(matrix);
                label = 'محدد المصفوفة';
                break;
            case 'inverse':
                result = matrixInverse(matrix);
                label = 'معكوس المصفوفة';
                break;
            case 'rank':
                result = matrixRank(matrix);
                label = 'رتبة المصفوفة';
                break;
            case 'trace':
                result = matrixTrace(matrix);
                label = 'أثر المصفوفة';
                break;
            case 'eigenvalues':
                result = matrixEigenvalues(matrix);
                label = 'القيم الذاتية';
                break;
            default:
                result = 'عملية غير معروفة';
        }

        if (result === null || result === undefined) {
            resultDiv.innerHTML = '⚠️ خطأ في العملية';
            return;
        }

        if (typeof result === 'number') {
            resultDiv.innerHTML = `<strong>${label}:</strong> ${result}`;
        } else if (Array.isArray(result)) {
            resultDiv.innerHTML = `<strong>${label}:</strong><br>` +
                result.map(row => '[' + row.map(v => Number.isInteger(v) ? v : v.toFixed(4)).join(' ') + ']').join(
                '<br>');
        } else if (result.λ1 !== undefined) {
            resultDiv.innerHTML =
                `<strong>${label}:</strong><br>λ₁ = ${result.λ1.toFixed(4)}<br>λ₂ = ${result.λ2.toFixed(4)}`;
        } else if (result.real !== undefined) {
            resultDiv.innerHTML = `<strong>${label}:</strong><br>${result.real.toFixed(4)} ± ${result.imag.toFixed(4)}i`;
        } else {
            resultDiv.innerHTML = `<strong>${label}:</strong> ${JSON.stringify(result)}`;
        }
    } catch (e) {
        resultDiv.innerHTML = '⚠️ خطأ: ' + e.message;
    }
}

// ============================================
// دوال الإحصاء
// ============================================

function calculateStatistics() {
    const text = document.getElementById('statsData').value;
    const data = text.split(',').map(Number).filter(n => !isNaN(n));
    const resultDiv = document.getElementById('statsResult');

    if (data.length < 2) {
        resultDiv.innerHTML = '⚠️ أدخل على الأقل قيمتين';
        return;
    }

    const stats = {
        'عدد القيم': data.length,
        'المجموع': data.reduce((a, b) => a + b, 0),
        'المتوسط': Statistics.mean(data),
        'الوسيط': Statistics.median(data),
        'المنوال': Statistics.mode(data).join(', '),
        'التباين (عينة)': Statistics.variance(data, true),
        'التباين (مجتمع)': Statistics.variance(data, false),
        'الانحراف المعياري': Statistics.stdDev(data, true),
        'المدى': Statistics.range(data),
        'المدى الربيعي': Statistics.iqr(data),
        'الالتواء': Statistics.skewness(data),
        'التفرطح': Statistics.kurtosis(data),
        'الحد الأدنى': Math.min(...data),
        'الحد الأقصى': Math.max(...data)
    };

    resultDiv.innerHTML = Object.entries(stats).map(([key, value]) =>
        `<div class="stats-item">
            <span class="label">${key}</span>
            <span class="value">${typeof value === 'number' ? value.toFixed(6) : value}</span>
        </div>`
    ).join('');
}

function calculateDistribution() {
    const type = document.getElementById('distType').value;
    const params = document.getElementById('distParams').value.split(',').map(Number);
    const resultDiv = document.getElementById('distResult');

    let result = {};
    let label = '';

    try {
        switch (type) {
            case 'binomial':
                const [n, k, p] = params;
                result = {
                    'P(X = k)': Statistics.binomial(n, k, p),
                    'E[X]': n * p,
                    'Var(X)': n * p * (1 - p)
                };
                label = 'التوزيع ثنائي الحدين';
                break;
            case 'poisson':
                const [lambda, k2] = params;
                result = {
                    'P(X = k)': Statistics.poisson(lambda, k2),
                    'E[X]': lambda,
                    'Var(X)': lambda
                };
                label = 'توزيع بواسون';
                break;
            case 'normal':
                const [x, mean, std] = params;
                const zScore = (x - mean) / std;
                result = {
                    'f(x)': Statistics.normal(x, mean, std),
                    'F(x)': Statistics.normalCDF(x, mean, std),
                    'z-score': zScore
                };
                label = 'التوزيع الطبيعي';
                break;
            case 'exponential':
                const [x2, lambda2] = params;
                result = {
                    'f(x)': Statistics.exponential(x2, lambda2),
                    'F(x)': Statistics.exponentialCDF(x2, lambda2),
                    'E[X]': 1 / lambda2,
                    'Var(X)': 1 / (lambda2 * lambda2)
                };
                label = 'التوزيع الأسي';
                break;
            case 'geometric':
                const [p2, k3] = params;
                result = {
                    'P(X = k)': Statistics.geometric(p2, k3),
                    'E[X]': 1 / p2,
                    'Var(X)': (1 - p2) / (p2 * p2)
                };
                label = 'التوزيع الهندسي';
                break;
            case 'uniform':
                const [x3, a, b] = params;
                result = {
                    'f(x)': Statistics.uniform(x3, a, b),
                    'E[X]': (a + b) / 2,
                    'Var(X)': (b - a) * (b - a) / 12
                };
                label = 'التوزيع المنتظم';
                break;
            default:
                resultDiv.innerHTML = '⚠️ توزيع غير معروف';
                return;
        }

        resultDiv.innerHTML = `<strong>${label}</strong><br>` +
            Object.entries(result).map(([key, value]) =>
                `<div class="stats-item" style="display:inline-block;margin:3px;padding:4px 10px;">
                    <span class="label">${key}</span>
                    <span class="value">${typeof value === 'number' ? value.toFixed(6) : value}</span>
                </div>`
            ).join('');
    } catch (e) {
        resultDiv.innerHTML = '⚠️ خطأ: ' + e.message;
    }
}

// ============================================
// دوال نظرية الأعداد
// ============================================

function numberTheoryOperation() {
    const n = parseInt(document.getElementById('numberTheoryInput').value);
    const resultDiv = document.getElementById('numberTheoryResult');

    if (!n || n < 1) {
        resultDiv.innerHTML = '⚠️ أدخل عدداً صحيحاً موجباً';
        return;
    }

    const factors = NumberTheory.primeFactors(n);
    const divisors = NumberTheory.divisors(n);
    const sumDiv = divisors.reduce((a, b) => a + b, 0);

    resultDiv.innerHTML = `
        <div class="stats-grid">
            <div class="stats-item"><span class="label">العدد</span><span class="value">${n}</span></div>
            <div class="stats-item"><span class="label">أولي؟</span><span class="value">${NumberTheory.isPrime(n) ? '✅ نعم' : '❌ لا'}</span></div>
            <div class="stats-item"><span class="label">العوامل الأولية</span><span class="value">${factors.join(' × ')}</span></div>
            <div class="stats-item"><span class="label">القواسم</span><span class="value">${divisors.join(', ')}</span></div>
            <div class="stats-item"><span class="label">عدد القواسم</span><span class="value">${divisors.length}</span></div>
            <div class="stats-item"><span class="label">مجموع القواسم</span><span class="value">${sumDiv}</span></div>
            <div class="stats-item"><span class="label">عدد تام؟</span><span class="value">${NumberTheory.isPerfect(n) ? '✅ نعم' : '❌ لا'}</span></div>
            <div class="stats-item"><span class="label">دالة أويلر φ(n)</span><span class="value">${NumberTheory.phi(n)}</span></div>
            <div class="stats-item"><span class="label">GCD(1,n)</span><span class="value">${NumberTheory.gcd(1, n)}</span></div>
            <div class="stats-item"><span class="label">LCM(1,n)</span><span class="value">${NumberTheory.lcm(1, n)}</span></div>
        </div>
    `;
}

function convertNumberSystem() {
    const value = document.getElementById('numSystemValue').value;
    const from = parseInt(document.getElementById('numSystemFrom').value);
    const to = parseInt(document.getElementById('numSystemTo').value);
    const resultDiv = document.getElementById('numSystemResult');

    try {
        const decimal = parseInt(value, from);
        if (isNaN(decimal)) {
            resultDiv.innerHTML = '⚠️ قيمة غير صالحة للأساس المحدد';
            return;
        }
        const result = decimal.toString(to);
        resultDiv.innerHTML = `
            <strong>${value}</strong> (الأساس ${from}) = 
            <strong>${result}</strong> (الأساس ${to})
            <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">
                القيمة العشرية: ${decimal}
            </div>
        `;
    } catch (e) {
        resultDiv.innerHTML = '⚠️ خطأ: ' + e.message;
    }
}

// ============================================
// دوال الأعداد المركبة
// ============================================

function complexOperation() {
    const a1 = parseFloat(document.getElementById('compA1').value) || 0;
    const b1 = parseFloat(document.getElementById('compB1').value) || 0;
    const a2 = parseFloat(document.getElementById('compA2').value) || 0;
    const b2 = parseFloat(document.getElementById('compB2').value) || 0;
    const op = document.getElementById('compOp').value;
    const resultDiv = document.getElementById('complexResult');

    const c1 = { r: a1, i: b1 };
    const c2 = { r: a2, i: b2 };
    let result, label;

    const display = (c) => {
        if (c.i === 0) return c.r.toString();
        if (c.i > 0) return `${c.r} + ${c.i}i`;
        return `${c.r} - ${Math.abs(c.i)}i`;
    };

    switch (op) {
        case 'add':
            result = complexAdd(c1, c2);
            label = 'الجمع';
            break;
        case 'subtract':
            result = complexSub(c1, c2);
            label = 'الطرح';
            break;
        case 'multiply':
            result = complexMul(c1, c2);
            label = 'الضرب';
            break;
        case 'divide':
            result = complexDiv(c1, c2);
            label = 'القسمة';
            break;
        case 'modulus':
            result = { r: complexMod(c1), i: 0 };
            label = 'المعيار';
            break;
        case 'argument':
            result = { r: complexArg(c1), i: 0 };
            label = 'الزاوية';
            break;
        case 'conjugate':
            result = complexConj(c1);
            label = 'المرافق';
            break;
        case 'power':
            const n = parseInt(document.getElementById('compA2').value) || 2;
            result = complexPow(c1, n);
            label = `القوة ${n}`;
            break;
        default:
            resultDiv.innerHTML = '⚠️ عملية غير معروفة';
            return;
    }

    let extra = '';
    if (op === 'modulus') extra = `<div>|${display(c1)}| = ${result.r.toFixed(6)}</div>`;
    if (op === 'argument') extra =
        `<div>arg(${display(c1)}) = ${(result.r * 180 / Math.PI).toFixed(2)}° = ${result.r.toFixed(4)} rad</div>`;
    if (op === 'conjugate') extra = `<div>conj(${display(c1)}) = ${display(result)}</div>`;
    if (op === 'power') extra = `<div>${display(c1)}^${parseInt(document.getElementById('compA2').value) || 2} = ${display(result)}</div>`;

    resultDiv.innerHTML = `
        <div><strong>${label}:</strong></div>
        <div>${display(c1)} ${op === 'add' ? '+' : op === 'subtract' ? '-' : op === 'multiply' ? '×' : op === 'power' ? '^' : '÷'} ${op === 'power' ? parseInt(document.getElementById('compA2').value) || 2 : display(c2)}</div>
        <div style="font-size:22px;font-weight:700;color:var(--primary);margin:6px 0;">
            = ${display(result)}
        </div>
        ${extra}
        ${op === 'divide' && result.r === Infinity ? '⚠️ القسمة على صفر' : ''}
    `;
}

// ============================================
// دوال المتتاليات
// ============================================

function calculateSequence() {
    const type = document.getElementById('seqType').value;
    const a = parseFloat(document.getElementById('seqA').value) || 1;
    const d = parseFloat(document.getElementById('seqD').value) || 2;
    const n = parseInt(document.getElementById('seqN').value) || 10;
    const resultDiv = document.getElementById('sequenceResult');

    let sequence = [];
    let sum = 0;
    let steps = [];

    if (type === 'arithmetic') {
        for (let i = 0; i < n; i++) {
            sequence.push(a + i * d);
        }
        sum = n / 2 * (2 * a + (n - 1) * d);
        steps = sequence.map((v, i) => `a${i+1} = ${a} + ${i}×${d} = ${v}`);
        resultDiv.innerHTML = `
            <div><strong>المتتالية الحسابية:</strong> ${sequence.join(', ')}</div>
            <div><strong>مجموع أول ${n} حدود:</strong> ${sum}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:6px;max-height:120px;overflow-y:auto;">
                ${steps.join('<br>')}
            </div>
        `;
    } else if (type === 'geometric') {
        for (let i = 0; i < n; i++) {
            sequence.push(a * Math.pow(d, i));
        }
        sum = d === 1 ? a * n : a * (1 - Math.pow(d, n)) / (1 - d);
        steps = sequence.map((v, i) => `a${i+1} = ${a} × ${d}^${i} = ${v}`);
        resultDiv.innerHTML = `
            <div><strong>المتتالية الهندسية:</strong> ${sequence.join(', ')}</div>
            <div><strong>مجموع أول ${n} حدود:</strong> ${sum}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:6px;max-height:120px;overflow-y:auto;">
                ${steps.join('<br>')}
            </div>
        `;
    } else if (type === 'fibonacci') {
        const fib = [0, 1];
        for (let i = 2; i <= n; i++) {
            fib.push(fib[i - 1] + fib[i - 2]);
        }
        sequence = fib.slice(0, n);
        steps = sequence.map((v, i) => `F${i} = ${i <= 1 ? i : sequence[i-1] + sequence[i-2]}`);
        resultDiv.innerHTML = `
            <div><strong>متتالية فيبوناتشي:</strong> ${sequence.join(', ')}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:6px;max-height:120px;overflow-y:auto;">
                ${steps.join('<br>')}
            </div>
        `;
    }
}

// ============================================
// دوال المعادلات
// ============================================

function solveQuadratic() {
    const a = parseFloat(document.getElementById('eqA').value) || 0;
    const b = parseFloat(document.getElementById('eqB').value) || 0;
    const c = parseFloat(document.getElementById('eqC').value) || 0;
    const resultDiv = document.getElementById('quadraticResult');

    if (a === 0) {
        resultDiv.innerHTML = '⚠️ a لا يمكن أن تكون صفراً';
        return;
    }

    const disc = b * b - 4 * a * c;
    let result = `<strong>المعادلة:</strong> ${a}x² + ${b}x + ${c} = 0<br>`;
    result += `<strong>المميز Δ = ${disc}</strong><br>`;

    if (disc > 0) {
        const x1 = (-b + Math.sqrt(disc)) / (2 * a);
        const x2 = (-b - Math.sqrt(disc)) / (2 * a);
        result += `✅ جذران حقيقيان مختلفان:<br>`;
        result += `x₁ = ${x1.toFixed(6)}<br>`;
        result += `x₂ = ${x2.toFixed(6)}`;
    } else if (disc === 0) {
        const x = -b / (2 * a);
        result += `✅ جذر حقيقي مزدوج:<br>`;
        result += `x = ${x.toFixed(6)}`;
    } else {
        const real = -b / (2 * a);
        const imag = Math.sqrt(-disc) / (2 * a);
        result += `✅ جذران مركبان:<br>`;
        result += `x₁ = ${real.toFixed(4)} + ${imag.toFixed(4)}i<br>`;
        result += `x₂ = ${real.toFixed(4)} - ${imag.toFixed(4)}i`;
    }

    resultDiv.innerHTML = result;
}

function solveSystem() {
    const input = document.getElementById('sysEq').value;
    const resultDiv = document.getElementById('systemResult');

    try {
        const equations = input.split(';').map(eq => eq.split(',').map(Number));
        if (equations.length !== 3 || equations.some(eq => eq.length !== 4)) {
            resultDiv.innerHTML = '⚠️ أدخل 3 معادلات بصيغة: a,b,c,d';
            return;
        }

        const [eq1, eq2, eq3] = equations;
        const det = eq1[0] * (eq2[1] * eq3[2] - eq2[2] * eq3[1]) -
            eq1[1] * (eq2[0] * eq3[2] - eq2[2] * eq3[0]) +
            eq1[2] * (eq2[0] * eq3[1] - eq2[1] * eq3[0]);

        if (det === 0) {
            resultDiv.innerHTML = '⚠️ النظام غير قابل للحل (المحدد = 0)';
            return;
        }

        const detX = eq1[3] * (eq2[1] * eq3[2] - eq2[2] * eq3[1]) -
            eq1[1] * (eq2[3] * eq3[2] - eq2[2] * eq3[3]) +
            eq1[2] * (eq2[3] * eq3[1] - eq2[1] * eq3[3]);
        const detY = eq1[0] * (eq2[3] * eq3[2] - eq2[2] * eq3[3]) -
            eq1[3] * (eq2[0] * eq3[2] - eq2[2] * eq3[0]) +
            eq1[2] * (eq2[0] * eq3[3] - eq2[3] * eq3[0]);
        const detZ = eq1[0] * (eq2[1] * eq3[3] - eq2[3] * eq3[1]) -
            eq1[1] * (eq2[0] * eq3[3] - eq2[3] * eq3[0]) +
            eq1[3] * (eq2[0] * eq3[1] - eq2[1] * eq3[0]);

        const x = detX / det;
        const y = detY / det;
        const z = detZ / det;

        resultDiv.innerHTML = `
            <strong>نظام المعادلات:</strong><br>
            ${eq1[0]}x + ${eq1[1]}y + ${eq1[2]}z = ${eq1[3]}<br>
            ${eq2[0]}x + ${eq2[1]}y + ${eq2[2]}z = ${eq2[3]}<br>
            ${eq3[0]}x + ${eq3[1]}y + ${eq3[2]}z = ${eq3[3]}<br>
            <strong>الحل:</strong><br>
            x = ${x.toFixed(6)}<br>
            y = ${y.toFixed(6)}<br>
            z = ${z.toFixed(6)}
        `;
    } catch (e) {
        resultDiv.innerHTML = '⚠️ خطأ: ' + e.message;
    }
}

function simplifyExpr() {
    const expr = document.getElementById('algebraExpr').value;
    const resultDiv = document.getElementById('algebraResult');
    try {
        const result = math.simplify(expr);
        resultDiv.innerHTML = `<strong>تبسيط:</strong> ${expr} = ${result}`;
    } catch (e) {
        resultDiv.innerHTML = '⚠️ خطأ: ' + e.message;
    }
}

function expandExpr() {
    const expr = document.getElementById('algebraExpr').value;
    const resultDiv = document.getElementById('algebraResult');
    try {
        const result = math.expand(expr);
        resultDiv.innerHTML = `<strong>توسيع:</strong> ${expr} = ${result}`;
    } catch (e) {
        resultDiv.innerHTML = '⚠️ خطأ: ' + e.message;
    }
}

function factorExpr() {
    const expr = document.getElementById('algebraExpr').value;
    const resultDiv = document.getElementById('algebraResult');
    try {
        const result = math.factor(expr);
        resultDiv.innerHTML = `<strong>تحليل:</strong> ${expr} = ${result}`;
    } catch (e) {
        resultDiv.innerHTML = '⚠️ خطأ: ' + e.message;
    }
}

function solveTrigonometric() {
    const expr = document.getElementById('trigEq').value;
    const resultDiv = document.getElementById('trigResult');
    try {
        // محاولة حل المعادلة المثلثية
        const solutions = math.solve(expr, 'x');
        if (solutions.length === 0) {
            resultDiv.innerHTML = '⚠️ لا توجد حلول';
        } else {
            resultDiv.innerHTML = `<strong>حل المعادلة:</strong> ${expr}<br>` +
                solutions.map((s, i) => `x${i+1} = ${s}`).join('<br>');
        }
    } catch (e) {
        resultDiv.innerHTML = '⚠️ خطأ: ' + e.message;
    }
}

// ============================================
// دوال المحول
// ============================================

function populateConverterUnits() {
    const category = document.getElementById('convCategory').value;
    const units = UnitConverter.getUnits(category);

    ['convFrom', 'convTo'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = units.map(u =>
                `<option value="${u}">${u}</option>`
            ).join('');
        }
    });
}

function convertUnits() {
    const category = document.getElementById('convCategory').value;
    const value = parseFloat(document.getElementById('convValue').value) || 0;
    const from = document.getElementById('convFrom').value;
    const to = document.getElementById('convTo').value;
    const resultDiv = document.getElementById('convResult');

    const result = UnitConverter.convert(value, from, to, category);
    if (result !== null && result !== undefined) {
        resultDiv.textContent = `${value} ${from} = ${result.toFixed(6)} ${to}`;
        resultDiv.style.color = '';
    } else {
        resultDiv.textContent = '⚠️ خطأ في التحويل';
        resultDiv.style.color = '#FF3B30';
    }
}

function swapUnits() {
    const from = document.getElementById('convFrom');
    const to = document.getElementById('convTo');
    const temp = from.value;
    from.value = to.value;
    to.value = temp;
    convertUnits();
}

// ============================================
// دقة الحساب
// ============================================

function setPrecision(val) {
    const precision = parseInt(val) || 12;
    engine.setPrecision(precision);
}

// ============================================
// لوحة المفاتيح
// ============================================

document.addEventListener('keydown', function(e) {
    const key = e.key;
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && key === 'z') {
        e.preventDefault();
        // undo (يمكن إضافة لاحقاً)
        return;
    }

    if (ctrl && key === 'h') {
        e.preventDefault();
        toggleHistory();
        return;
    }

    if (key >= '0' && key <= '9' || ['+', '-', '*', '/', '.', '(', ')', '%'].includes(key)) {
        e.preventDefault();
        input(key);
    } else if (key === 'Enter') {
        e.preventDefault();
        calculate();
    } else if (key === 'Escape') {
        e.preventDefault();
        clearAll();
    } else if (key === 'Backspace') {
        e.preventDefault();
        const display = document.getElementById('expressionDisplay');
        display.textContent = display.textContent.slice(0, -1);
    }
});

// ============================================
// تهيئة الصفحة
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    populateConverterUnits();
    updateHistory();
    createMatrix();

    // إظهار السجل الجانبي
    document.getElementById('historySidebar').style.display = 'flex';

    // ضبط الدقة الابتدائية
    setPrecision(12);

    console.log('🧮 الحاسبة المتكاملة جاهزة!');
    console.log('📊 جميع الوظائف: حساب، علمي، رسم، مصفوفات، إحصاء، تحويل، نظرية أعداد، مركبات، معادلات');
    console.log('🎨 اختر اللون من زر 🌙/☀️');
    console.log('⌨️ استخدم لوحة المفاتيح للتحكم');
    console.log('📝 Ctrl+H لإظهار/إخفاء السجل');
});

// تصدير للاستخدام العالمي
window.input = input;
window.calculate = calculate;
window.clearAll = clearAll;
window.memory = memory;
window.toggleSign = toggleSign;
window.setAngleMode = setAngleMode;
window.switchMode = switchMode;
window.switchTab = switchTab;
window.toggleTheme = toggleTheme;
window.toggleFullscreen = toggleFullscreen;
window.toggleHistory = toggleHistory;
window.useHistory = useHistory;
window.clearHistory = clearHistory;
window.exportHistory = exportHistory;
window.plotGraph = plotGraph;
window.clearGraph = clearGraph;
window.graphZoom = graphZoom;
window.graphReset = graphReset;
window.graphFindRoots = graphFindRoots;
window.graphFindExtrema = graphFindExtrema;
window.graphDerivative = graphDerivative;
window.createMatrix = createMatrix;
window.randomMatrix = randomMatrix;
window.matrixOperation = matrixOperation;
window.calculateStatistics = calculateStatistics;
window.calculateDistribution = calculateDistribution;
window.numberTheoryOperation = numberTheoryOperation;
window.convertNumberSystem = convertNumberSystem;
window.complexOperation = complexOperation;
window.calculateSequence = calculateSequence;
window.solveQuadratic = solveQuadratic;
window.solveSystem = solveSystem;
window.simplifyExpr = simplifyExpr;
window.expandExpr = expandExpr;
window.factorExpr = factorExpr;
window.solveTrigonometric = solveTrigonometric;
window.convertUnits = convertUnits;
window.swapUnits = swapUnits;
window.populateConverterUnits = populateConverterUnits;
window.setPrecision = setPrecision;