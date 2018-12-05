export const sliderConfigs = {
  'plan-nat': {
    'grid-dist': {
      'default': '1',
      'label': 'Grid dist connected',
      'max': '5',
      'min': '0',
      'step': '0.5',
      'unit': 'km',
      'tooltip': 'Consider clusters within this distance as already connected.'
    },
    'min-ntl': {
      'default': '20',
      'label': 'Minimum night lights connected',
      'max': '255',
      'min': '0',
      'step': '5',
      'unit': '',
      'tooltip': 'Minimum night lights value to consider a cluster already connected.'
    },
    'min-pop': {
      'default': '100',
      'label': 'Minimum population',
      'max': '1000',
      'min': '0',
      'step': '50',
      'unit': '',
      'tooltip': 'Exclude from analysis villages with less that this population.'
    },
    'demand-ppm': {
      'default': '6',
      'label': 'Demand',
      'max': '100',
      'min': '0',
      'step': '2',
      'unit': 'kWh/p/month',
      'tooltip': 'The average electricity demand per person in all clusters.'
    },
    'mg-gen-cost': {
      'default': '4000',
      'label': 'Minigrid gen cost',
      'max': '10000',
      'min': '0',
      'step': '500',
      'unit': 'USD/kW',
      'tooltip': 'Installed cost of a minigrid system, excluding distribution.'
    },
    'mg-dist-cost': {
      'default': '2',
      'label': 'Minigrid dist cost',
      'max': '10',
      'min': '0',
      'step': '1',
      'unit': 'USD/m2',
      'tooltip': 'Minigrid distribution cost as a function of village size.'
    },
    'grid-mv-cost': {
      'default': '50',
      'label': 'Grid MV wire cost',
      'max': '200',
      'min': '0',
      'step': '10',
      'unit': 'USD/m',
      'tooltip': 'Grid MV lines extension cost.'
    },
    'grid-lv-cost': {
      'default': '2',
      'label': 'Grid LV wire cost',
      'max': '10',
      'min': '0',
      'step': '1',
      'unit': 'USD/m2',
      'tooltip': 'Local in-cluster grid distribution cost as a function of village size.'
    },
  },
  'plan-loc': {
    'min-area': {
      'default': '30',
      'label': 'Minimum building size',
      'max': '100',
      'min': '0',
      'step': '5',
      'unit': 'm2',
      'tooltip': 'Exclude from analysis buildings below this size.'
    },
    'demand': {
      'default': '10',
      'label': 'Demand',
      'max': '100',
      'min': '0',
      'step': '2',
      'unit': 'kWh/person/month',
      'tooltip': 'Electricity demand per person.'
    },
    'tariff': {
      'default': '0.5',
      'label': 'Tariff',
      'max': '1',
      'min': '0',
      'step': '0.05',
      'unit': 'USD/kWh',
      'tooltip': 'Tariff to be charged to consumers.'
    },
    'gen-cost': {
      'default': '1000',
      'label': 'Generator cost',
      'max': '10000',
      'min': '0',
      'step': '500',
      'unit': 'USD/kW',
      'tooltip': 'Installed cost of a minigrid system, excluding distribution.'
    },
    'wire-cost': {
      'default': '10',
      'label': 'Wire cost',
      'max': '50',
      'min': '0',
      'step': '5',
      'unit': 'USD/m',
      'tooltip': 'Cost of local distribution wires.'
    },
    'conn-cost': {
      'default': '100',
      'label': 'Connection cost',
      'max': '500',
      'min': '0',
      'step': '20',
      'unit': 'USD/building',
      'tooltip': 'The connection cost per building.'
    },
    'opex-ratio': {
      'default': '2',
      'label': 'OPEX ratio',
      'max': '10',
      'min': '0',
      'step': '1',
      'unit': '%',
      'tooltip': 'Annual operating costs as a percentage of CAPEX.'
    },
    'years': {
      'default': '20',
      'label': 'Project life',
      'max': '30',
      'min': '0',
      'step': '1',
      'unit': 'years',
      'tooltip': 'Years over which to amortise project.'
    },
    'discount-rate': {
      'default': '6',
      'label': 'Discount rate',
      'max': '20',
      'min': '0',
      'step': '1',
      'unit': '%',
      'tooltip': 'For calculating NPV.'
    }
  },
  'find-nat': {
    'min-pop': {
      'default': '500',
      'label': 'Minimum population',
      'max': '2000',
      'min': '0',
      'step': '100',
      'unit': '',
      'tooltip': 'Exclude clusters with less than this population.'
    },
    'min-grid-dist': {
      'default': '10',
      'label': 'Minimum grid distance',
      'max': '20',
      'min': '0',
      'step': '1',
      'unit': 'km',
      'tooltip': 'Exclude clusters closer than this to the grid.'
    },
    'max-ntl': {
      'default': '200',
      'label': 'Maximum night time lights',
      'max': '255',
      'min': '150',
      'step': '5',
      'unit': '',
      'tooltip': 'Exclude clusters above this level of night lights.'
    },
  }
};

export const summaryConfigs = {
  'plan-nat': {
    'tot-cost': {
      'label': 'Total cost',
      'unit': 'USD'
    },
    'new-conn': {
      'label': 'New grid villages',
      'unit': ''
    },
    'new-og': {
      'label': 'New off-grid villages',
      'unit': ''
    },
    'model-pop': {
      'label': 'Modelled pop',
      'unit': ''
    },
    'orig-conn-pop': {
      'label': 'Already connected pop',
      'unit': ''
    },
    'new-conn-pop': {
      'label': 'New grid pop',
      'unit': ''
    },
    'new-og-pop': {
      'label': 'Off-grid pop',
      'unit': ''
    }
  },
  'plan-loc': {
    'npv': {
      'label': 'NPV',
      'unit': 'USD'
    },
    'capex': {
      'label': 'CAPEX',
      'unit': 'USD'
    },
    'opex': {
      'label': 'OPEX',
      'unit': 'USD/year'
    },
    'income': {
      'label': 'Income',
      'unit': 'USD/year'
    },
    'connected': {
      'label': 'Connections',
      'unit': ''
    },
    'gen-size': {
      'label': 'Generator size',
      'unit': 'kW'
    },
    'line-length': {
      'label': 'Total line length',
      'unit': 'm'
    }
  },
  'find-nat': {
    'num-clusters': {
      'label': 'Clusters found',
      'unit': ''
    }
  }
};

export const countries = {
  'lesotho': {
    // bounds are [W, S], [E, N]
    'bounds': [[27.0344, -30.3513], [29.1263, -28.5838]],
    'pop': 2233000,
    'access-rate': 0.297,
    'access-urban': 0.66,
    'access-rural': 0.157
  },
  'rwanda': {
    'bounds': [[28.329516540, -2.884785794], [31.431263800, -1.002637116]],
    'pop': 12210000,
    'access-rate': 0.294,
    'access-urban': 0.8,
    'access-rural': 0.178
  }
};

export const layerColors = {
  'grid': '#474747', // grey
  'clustersPlan': {
    'default': '#1d0b1c', //grey
    'orig': '#377eb8', // blue
    'new': '#4daf4a', // green
    'og': '#e41a1c' // red
  },
  'clustersFind': {
    'default': '#1d0b1c', //grey
    'top': '#9ebcda', // light blue
    'bottom': '#6e016b' // purple
  },
  'network': '#339900', // green
  'buildings': {
    'default': '#005824', // dark green
    'bottom': '#ccece6', // light
    'top': '#005824' // dark green
  },
  'lv': '#4f5283' // grey
};
