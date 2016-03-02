$(document).ready(function() {
  $(document).on('click', '.btn-copy', function(event){
    event.preventDefault();
    console.log('clicked copy',$(this))
    var thisIndex = $(this).attr('data-index')
    document.execCommand('copy', false, document.getElementById('copy-'+thisIndex).select());
  })
});
