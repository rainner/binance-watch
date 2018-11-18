/**
 * File data import/export helper module
 */
export default {

  // export some data to a json file by name
  exportData( name, data ) {
    // prep file name and data to be saved
    name = String( name || '' ) || 'export_data_'+ Date.now();
    data = 'data:text/json;charset=utf-8,'+ encodeURIComponent( JSON.stringify( data || {} ) );

    // create a link with download attribute
    const elm = this._elm( 'a', 'fileExportLinkElement' );
    elm.setAttribute( 'href', data );
    elm.setAttribute( 'download', name +'.json' );
    elm.setAttribute( 'target', '_blank' );

    // trigger download and remove element
    setTimeout( () => elm.click(), 100 );
    setTimeout( () => elm.remove(), 1000 );
  },

  // import a file and have it's data passed to a custom callback
  importData( callback ) {
    if ( !callback || typeof callback !== 'function' ) return;

    // create file input element
    const elm = this._elm( 'input', 'fileImportInputElement' );
    elm.setAttribute( 'type', 'file' );
    elm.setAttribute( 'accept', '.json' );
    elm.addEventListener( 'change', e => {

      // remove it after a file has been selected
      setTimeout( () => elm.remove(), 100 );

      // make sure we have a file and FileReader support
      if ( !e || !e.target ) return;
      if ( !e.target.files || !e.target.files.length ) return;
      if ( !( 'FileReader' in window ) ) return;

      // read the selected file and pass loaded data to callback
      const reader = new FileReader();
      reader.readAsText( e.target.files[ 0 ], 'utf-8' );
      reader.addEventListener( 'load', e => {
        let data = JSON.parse( e.target.result ) || null;
        callback( data );
      });
    });
    // trigger file select dialog
    setTimeout( () => elm.click(), 100 );
  },

  // create a new hidden element
  _elm( tag, id ) {
    let elm;
    // look for existing element by id
    elm = document.getElementById( id );
    if ( elm ) return elm;
    // create a new element
    elm = document.createElement( tag );
    elm.setAttribute( 'style', 'display:block; overflow:hidden; visibility:hidden; max-height:0;' );
    elm.setAttribute( 'id', id );
    document.body.appendChild( elm );
    return elm;
  },

}
