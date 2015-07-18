class ProgressFileGraph:
    pass

if __name__ == "__main__":
    import sys
    from http.server import HTTPServer, SimpleHTTPRequestHandler

    '''
    if(len(sys.argv) < 2):
        print("Please give progress root directory");
        sys.exit(1)
    '''

    server_address = ('localhost', 8000)
    httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
    httpd.serve_forever()
