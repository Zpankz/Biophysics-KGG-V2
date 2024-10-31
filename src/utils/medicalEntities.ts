// Entity types with expanded biophysical categories
export const entityTypes = {
  BIOMOLECULE: 1,
  PHYSICAL_PROPERTY: 2,
  CHEMICAL_PROCESS: 3,
  CELLULAR_COMPONENT: 4,
  PATHWAY_MECHANISM: 5,
  BIOPHYSICAL_FORCE: 6,
  STRUCTURAL_ELEMENT: 7,
  KINETIC_PARAMETER: 8
} as const;

// Expanded patterns for biophysical concepts
export const medicalPatterns = {
  // Biomolecules and their properties
  biomolecules: [
    'protein', 'enzyme', 'receptor', 'ion', 'molecule', 'peptide',
    'lipid', 'membrane', 'channel', 'transporter', 'carrier',
    'cofactor', 'substrate', 'ligand', 'metabolite', 'nucleotide',
    'phosphate', 'complex', 'domain', 'subunit', 'polymer'
  ],

  // Physical properties and states
  physical_properties: [
    'charge', 'potential', 'force', 'pressure', 'gradient',
    'concentration', 'temperature', 'pH', 'voltage', 'energy',
    'entropy', 'equilibrium', 'stability', 'conformation',
    'folding', 'state', 'phase', 'density', 'viscosity'
  ],

  // Chemical processes
  chemical_processes: [
    'reaction', 'binding', 'catalysis', 'hydrolysis', 'oxidation',
    'reduction', 'phosphorylation', 'methylation', 'synthesis',
    'degradation', 'isomerization', 'conjugation', 'coupling'
  ],

  // Cellular components
  cellular_components: [
    'membrane', 'cytoskeleton', 'vesicle', 'organelle',
    'ribosome', 'nucleus', 'mitochondria', 'endosome',
    'cytosol', 'matrix', 'junction', 'pore', 'compartment'
  ],

  // Pathways and mechanisms
  pathways: [
    'pathway', 'cascade', 'cycle', 'mechanism', 'regulation',
    'signaling', 'transport', 'trafficking', 'assembly',
    'homeostasis', 'feedback', 'coupling', 'integration'
  ],

  // Biophysical forces
  biophysical_forces: [
    'hydrophobic', 'electrostatic', 'covalent', 'hydrogen bond',
    'van der waals', 'osmotic', 'mechanical', 'thermal',
    'surface tension', 'diffusion', 'friction', 'elasticity'
  ],

  // Structural elements
  structural_elements: [
    'helix', 'sheet', 'fold', 'domain', 'motif', 'backbone',
    'sidechain', 'interface', 'pocket', 'channel', 'pore',
    'scaffold', 'network', 'assembly', 'complex'
  ],

  // Kinetic parameters
  kinetic_parameters: [
    'rate', 'constant', 'affinity', 'velocity', 'flux',
    'conductance', 'permeability', 'diffusion', 'coefficient',
    'half-life', 'threshold', 'capacity', 'efficiency'
  ]
};

// Enhanced relationship types for biophysical interactions
export const relationshipTypes = {
  BINDS_TO: 'binds to',
  CATALYZES: 'catalyzes',
  TRANSPORTS: 'transports',
  REGULATES: 'regulates',
  STABILIZES: 'stabilizes',
  ACTIVATES: 'activates',
  INHIBITS: 'inhibits',
  MODIFIES: 'modifies',
  FORMS_COMPLEX: 'forms complex with',
  MEDIATES: 'mediates',
  DEPENDS_ON: 'depends on',
  CONVERTS: 'converts',
  EQUILIBRATES: 'equilibrates with',
  COUPLES_TO: 'couples to'
} as const;

// Expanded patterns for biophysical relationships
export const relationshipPatterns = {
  [relationshipTypes.BINDS_TO]: [
    'bind', 'attach', 'associate', 'complex', 'interact',
    'dock', 'recognize', 'target', 'anchor'
  ],
  [relationshipTypes.CATALYZES]: [
    'catalyze', 'accelerate', 'facilitate', 'enable',
    'process', 'convert', 'transform'
  ],
  [relationshipTypes.TRANSPORTS]: [
    'transport', 'carry', 'move', 'transfer', 'shuttle',
    'translocate', 'channel', 'pump'
  ],
  [relationshipTypes.REGULATES]: [
    'regulate', 'control', 'modulate', 'adjust', 'tune',
    'maintain', 'coordinate', 'govern'
  ],
  [relationshipTypes.STABILIZES]: [
    'stabilize', 'strengthen', 'reinforce', 'support',
    'maintain', 'protect', 'preserve'
  ],
  [relationshipTypes.ACTIVATES]: [
    'activate', 'trigger', 'initiate', 'induce', 'stimulate',
    'promote', 'enhance', 'potentiate'
  ],
  [relationshipTypes.INHIBITS]: [
    'inhibit', 'block', 'suppress', 'prevent', 'reduce',
    'decrease', 'attenuate', 'antagonize'
  ],
  [relationshipTypes.MODIFIES]: [
    'modify', 'alter', 'change', 'affect', 'influence',
    'transform', 'restructure', 'remodel'
  ],
  [relationshipTypes.FORMS_COMPLEX]: [
    'form', 'assemble', 'aggregate', 'oligomerize',
    'polymerize', 'associate', 'combine'
  ],
  [relationshipTypes.MEDIATES]: [
    'mediate', 'facilitate', 'enable', 'conduct',
    'transmit', 'relay', 'bridge'
  ],
  [relationshipTypes.DEPENDS_ON]: [
    'depend', 'require', 'need', 'rely', 'contingent',
    'determined by', 'function of'
  ],
  [relationshipTypes.CONVERTS]: [
    'convert', 'transform', 'change', 'turn', 'metabolize',
    'process', 'modify'
  ],
  [relationshipTypes.EQUILIBRATES]: [
    'equilibrate', 'balance', 'stabilize', 'equalize',
    'settle', 'reach steady state'
  ],
  [relationshipTypes.COUPLES_TO]: [
    'couple', 'link', 'connect', 'coordinate', 'synchronize',
    'integrate', 'pair'
  ]
};