/* global instances, Vue, Dygraph, moment, _ */
$(function() {

  Vue.component('sparkline', {
    props: ['instance', 'metric'],
    mounted: createChart,
    template: '<div></div>'
  });

  Vue.component('checks', {
    props: ['instance'],
    data: function() {
      return {
        checks: {}
      };
    },
    mounted: loadChecks,
    template: `
    <div>
    Status:
    <span class="badge badge-ok" v-if="!checks.WARNING && !checks.CRITICAL">OK</span>
    <span class="badge badge-warning" v-if="checks.WARNING">WARNING: {{ checks.WARNING }}</span>
    <span class="badge badge-critical" v-if="checks.CRITICAL">CRITICAL: {{ checks.CRITICAL }}</span>
    </div>
    `
  });

  new Vue({
    el: '#instances',
    data: {
      instances: instances
    },
    methods: {
      hasMonitoring: function(instance) {
        var plugins = instance.plugins.map(function(plugin) {
          return plugin.plugin_name;
        });
        return plugins.indexOf('monitoring') != -1;
      }
    }
  });

  function createChart() {
    var api_url = ['/server', this.instance.agent_address, this.instance.agent_port, 'monitoring'].join('/');

    var start = moment().subtract(1, 'hours').toISOString();
    var end = moment().toISOString();
    var defaultOptions = {
      axes: {
        x: {
          drawGrid: false,
          axisLabelFontSize: 9,
          axisLabelColor: '#999',
          pixelsPerLabel: 40,
          gridLineColor: '#dfdfdf',
          axisLineColor: '#dfdfdf'
          //drawAxis: false
        },
        y: {
          axisLabelFontSize: 9,
          axisLabelColor: '#999',
          axisLabelWidth: 15,
          pixelsPerLabel: 10,
          drawAxesAtZero: true,
          includeZero: true,
          axisLineColor: '#dfdfdf',
          gridLineColor: '#dfdfdf'
        }
      },
      legend: 'never',
      xValueParser: function(x) {
        var m = moment(x);
        return m.toDate().getTime();
      },
      highlightCircleSize: 0,
      interactionModel: {}
    };

    var options = defaultOptions;
    switch (this.metric) {
    case 'load1':
      options = $.extend({colors: ['#FAA43A']}, options);
      break;
    case 'tps':
      options = $.extend({colors: ['#50BD68', '#F15854']}, options);
      break;
    }
    new Dygraph(
      this.$el,
      api_url + "/data/" + this.metric + "?start=" + start + "&end=" + end,
      options
    );
  }

  function loadChecks() {
    var url = ['/server', this.instance.agent_address, this.instance.agent_port, 'alerting/checks.json'].join('/');
    $.ajax(url).success(function(data) {
      this.checks = _.countBy(data.map(function(check) { return check.state; }));
    }.bind(this));
  }
});
