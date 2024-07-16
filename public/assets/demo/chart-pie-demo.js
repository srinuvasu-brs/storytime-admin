function pieChart(labels, values) {
  let colors = [];
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < labels.length; i++) {
    colors.push('#'+Math.floor(Math.random()*16777215).toString(16));
  }
  Chart.defaults.global.defaultFontFamily = '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  Chart.defaults.global.defaultFontColor = '#292b2c';
  var ctx = document.getElementById("myPieChart");
  var myPieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
      }],
    },
  });
}