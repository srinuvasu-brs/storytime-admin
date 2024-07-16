// Set new default font family and font color to mimic Bootstrap's default styling
Chart.defaults.global.defaultFontFamily = '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#292b2c';

function barChart(labels, values) {
  let colors = [];
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < labels.length; i++) {
    colors.push('#'+Math.floor(Math.random()*16777215).toString(16));
  }
  var ctx = document.getElementById("myBarChart");
  var myLineChart = new Chart(ctx, {
    type: 'bar',
    data: {
      base:150,
      labels: labels,
      datasets: [{
        label: "Shows",
        data: values,
        backgroundColor: "rgba(2,117,216,1)",
        borderColor: "rgba(2,117,216,1)",
      }],
    },
    options: {
      scales:{
        xAxes: [{
            barPercentage: 0.6
        }],
        yAxes: [{
            ticks: {
                beginAtZero: true
            }
        }]
      },
      legend: {
        display: false
      }
    }
  });
}