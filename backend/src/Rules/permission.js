const PERMISSIONS = {
VIEW_RESOURCES: {1: 'all', 2: 'all', 3: 'all', 4: 'all', 5: 'all'},
RESERVE_OWN_QUARTER: {1: null, 2: ['QC'], 3: ['QC'] , 4: ['QC'], 5: ['QC']},
REQUEST_ADJACENT: {1: null, 2: null, 3: ['QC'], 4: ['QC', 'LC'], 5: 'all'},
ORGANIZE_TRANSIT: {1: null, 2: null, 3: null, 4: ['LC'], 5: ['LC', 'CD']},
REQUISITION: {1: null, 2: null, 3: null, 4: ['CD'], 5: ['CD']},
LOWER_RETENTION: {1: null, 2: null, 3: null, 4: null, 5: ['CD']},
APPROVE_TRANSFER: {1: null, 2: null, 3: ['QC'], 4: ['QC', 'LC'], 5: 'all'}
};

function canPerform(role, action, level) {
    const rule = PERMISSIONS[action]?.[level];
        if (rule === 'all') {
            return true;
        } 
        if (Array.isArray(rule)) {
            return rule.includes(role);
        } 
return false;
}

module.exports = { PERMISSIONS, canPerform };