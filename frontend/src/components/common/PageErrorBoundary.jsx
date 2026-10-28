import React from 'react';
export default class PageErrorBoundary extends React.Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(){/* No user data or tokens are logged. */}
  render(){return this.state.failed?<section className="med-subpage-card" role="alert"><h2>Halaman tidak dapat ditampilkan</h2><p>Data sebelumnya tetap tersimpan. Kembali ke dashboard untuk melanjutkan.</p><button className="btn-pill-primary" onClick={()=>{this.setState({failed:false});this.props.onBack();}}>Kembali ke dashboard</button></section>:this.props.children;}
}
