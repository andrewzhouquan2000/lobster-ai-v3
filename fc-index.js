module.exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: '<h1>Lobster AI V2</h1><p>FC 部署成功！</p>'
  };
};