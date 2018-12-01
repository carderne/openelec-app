export const sliderConfigs = {
  'plan-nat': {
    'grid-dist': {
      'default': '1000',
      'label': 'Grid dist connected',
      'max': '5000',
      'min': '0',
      'step': '500',
      'unit': 'm'
    },
    'min-pop': {
      'default': '100',
      'label': 'Minimum population',
      'max': '1000',
      'min': '0',
      'step': '50',
      'unit': ''
    },
    'demand-ppm': {
      'default': '6',
      'label': 'Demand',
      'max': '100',
      'min': '0',
      'step': '2',
      'unit': 'kWh/p/month'
    },
    'mg-gen-cost': {
      'default': '4000',
      'label': 'Minigrid gen cost',
      'max': '10000',
      'min': '0',
      'step': '500',
      'unit': 'USD/kW'
    },
    'mg-dist-cost': {
      'default': '2',
      'label': 'Minigrid dist cost',
      'max': '10',
      'min': '0',
      'step': '1',
      'unit': 'USD/m2'
    },
    'grid-mv-cost': {
      'default': '50',
      'label': 'Grid MV wire cost',
      'max': '200',
      'min': '0',
      'step': '10',
      'unit': 'USD/m'
    },
    'grid-lv-cost': {
      'default': '2',
      'label': 'Grid LV wire cost',
      'max': '10',
      'min': '0',
      'step': '1',
      'unit': 'USD/m2'
    }
  },
  'plan-loc': {
    'min-area': {
      'default': '30',
      'label': 'Minimum building size',
      'max': '100',
      'min': '0',
      'step': '5',
      'unit': 'm2'
    },
    'demand': {
      'default': '10',
      'label': 'Demand',
      'max': '100',
      'min': '0',
      'step': '2',
      'unit': 'kWh/person/month'
    },
    'tariff': {
      'default': '0.5',
      'label': 'Tariff',
      'max': '1',
      'min': '0',
      'step': '0.05',
      'unit': 'USD/kWh'
    },
    'gen-cost': {
      'default': '1000',
      'label': 'Generator cost',
      'max': '10000',
      'min': '0',
      'step': '500',
      'unit': 'USD/kW'
    },
    'wire-cost': {
      'default': '10',
      'label': 'Wire cost',
      'max': '50',
      'min': '0',
      'step': '5',
      'unit': 'USD/m'
    },
    'conn-cost': {
      'default': '100',
      'label': 'Connection cost',
      'max': '500',
      'min': '0',
      'step': '20',
      'unit': 'USD/building'
    },
    'opex-ratio': {
      'default': '2',
      'label': 'OPEX ratio',
      'max': '10',
      'min': '0',
      'step': '1',
      'unit': '%'
    },
    'years': {
      'default': '20',
      'label': 'Project life',
      'max': '30',
      'min': '0',
      'step': '1',
      'unit': 'years'
    },
    'discount-rate': {
      'default': '6',
      'label': 'Discount rate',
      'max': '20',
      'min': '0',
      'step': '1',
      'unit': '%'
    }
  },
  'find-nat': {
    'min-pop': {
      'default': '500',
      'label': 'Minimum population',
      'max': '2000',
      'min': '0',
      'step': '100',
      'unit': ''
    },
    'min-grid-dist': {
      'default': '10',
      'label': 'Minimum grid distance',
      'max': '20',
      'min': '0',
      'step': '1',
      'unit': 'km'
    }
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
    'lat': -29.45,
    'lng': 27.0,
    'zoom': 8,
    'urban_elec': 0.47
  },
  'rwanda': {
    'bounds': [[28.329516540, -2.884785794], [31.431263800, -1.002637116]],
    'lat': -29.45,
    'lng': 27.0,
    'zoom': 8,
    'urban_elec': 0.47
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
