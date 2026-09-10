using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;

[assembly: AssemblyTitle("2026_8月合輯 — AXIS-09")]
[assembly: AssemblyDescription("Single-file offline engineering portfolio launcher")]
[assembly: AssemblyVersion("1.1.0.0")]
[assembly: AssemblyFileVersion("1.1.0.0")]

namespace Axis09 {
 internal static class Program {
  internal const string Version="1.1.0";
  private const string MutexName=@"Local\AXIS09.Collection.Launcher.v1";
  private const string OpenEventName=@"Local\AXIS09.Collection.Open.v1";
  [STAThread] private static int Main(string[] args) {
   bool created;
   using(var mutex=new Mutex(true,MutexName,out created)) {
    if(!created) {
     for(int i=0;i<20;i++) {
      try {using(var signal=EventWaitHandle.OpenExisting(OpenEventName)){signal.Set();} return 0;}
      catch(WaitHandleCannotBeOpenedException){Thread.Sleep(100);}
     }
     return 0;
    }
    using(var openEvent=new EventWaitHandle(false,EventResetMode.AutoReset,OpenEventName)) {
     try {
      Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);
      bool noBrowser=Array.IndexOf(args,"--no-browser")>=0;
      using(var context=new LauncherContext(openEvent,noBrowser)) {Application.Run(context);}
      return 0;
     } catch(Exception ex) {
      MessageBox.Show("無法啟動 AXIS-09：\n"+ex.Message,"2026_8月合輯",MessageBoxButtons.OK,MessageBoxIcon.Error);
      return 1;
     } finally {mutex.ReleaseMutex();}
    }
   }
  }
 }
 internal sealed class LauncherContext:ApplicationContext {
  private readonly LocalServer server;
  private readonly NotifyIcon tray;
  private readonly System.Windows.Forms.Timer timer;
  private readonly string instanceFile;
  private readonly EventWaitHandle openEvent;
  private readonly bool noBrowser;
  private bool browserOpened;
  internal LauncherContext(EventWaitHandle signal,bool silent) {
   openEvent=signal;noBrowser=silent;
   server=new LocalServer();server.Start();
   string appDir=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"AXIS09");
   Directory.CreateDirectory(appDir);instanceFile=Path.Combine(appDir,"instance.json");
   var menu=new ContextMenuStrip();
   menu.Items.Add("開啟 2026_8月合輯",null,delegate{OpenBrowser();});
   menu.Items.Add("開啟分鏡總覽",null,delegate{OpenUrl(server.Url+"storyboard.html");});
   menu.Items.Add(new ToolStripSeparator());
   menu.Items.Add("結束 AXIS-09",null,delegate{ExitThread();});
   tray=new NotifyIcon {Icon=SystemIcons.Application,Text="2026_8月合輯 · AXIS-09",ContextMenuStrip=menu,Visible=true};
   tray.DoubleClick+=delegate{OpenBrowser();};
   timer=new System.Windows.Forms.Timer {Interval=400};
   timer.Tick+=delegate{if(openEvent.WaitOne(0)&&!noBrowser)OpenBrowser();};
   timer.Start();
   WriteInstance();
   if(!noBrowser)OpenBrowser();
  }
  private void WriteInstance() {
   File.WriteAllText(instanceFile,"{\"app\":\"AXIS09\",\"version\":\""+Program.Version+"\",\"pid\":"+Process.GetCurrentProcess().Id+",\"url\":\""+server.Url+"\",\"browserOpened\":"+(browserOpened?"true":"false")+"}",new UTF8Encoding(false));
  }
  private void OpenBrowser(){OpenUrl(server.Url);}
  private void OpenUrl(string url) {
   try {Process.Start(new ProcessStartInfo(url){UseShellExecute=true});browserOpened=true;WriteInstance();}
   catch(Exception) {MessageBox.Show("請用瀏覽器開啟：\n"+url,"AXIS-09 已啟動",MessageBoxButtons.OK,MessageBoxIcon.Information);}
  }
  protected override void ExitThreadCore() {
   timer.Stop();tray.Visible=false;server.Dispose();
   try{if(File.Exists(instanceFile))File.Delete(instanceFile);}catch(IOException){}
   base.ExitThreadCore();
  }
  protected override void Dispose(bool disposing) {
   if(disposing){timer.Dispose();tray.Dispose();server.Dispose();}
   base.Dispose(disposing);
  }
 }
 internal sealed class LocalServer:IDisposable {
  private readonly Dictionary<string,byte[]> files=new Dictionary<string,byte[]>(StringComparer.OrdinalIgnoreCase);
  private readonly SemaphoreSlim slots=new SemaphoreSlim(24);
  private TcpListener listener;
  private volatile bool running;
  private int port;
  internal string Url {get{return "http://127.0.0.1:"+port+"/";}}
  internal LocalServer() {
   using(Stream resource=Assembly.GetExecutingAssembly().GetManifestResourceStream("AXIS09.Website.zip")) {
    if(resource==null)throw new InvalidOperationException("內建網站資料不存在。");
    using(var archive=new ZipArchive(resource,ZipArchiveMode.Read)) {
     foreach(var entry in archive.Entries) {
      if(entry.Name.Length==0)continue;
      string name=entry.FullName.Replace('\\','/');
      if(name.StartsWith("/")||name.Contains("../"))throw new InvalidDataException("Invalid embedded asset path.");
      using(var stream=entry.Open())using(var memory=new MemoryStream()) {stream.CopyTo(memory);files.Add(name,memory.ToArray());}
     }
    }
   }
   if(!files.ContainsKey("showcase.html"))throw new InvalidDataException("Missing website entry.");
  }
  internal void Start() {
   listener=new TcpListener(IPAddress.Loopback,18409);
   try{listener.Start();}
   catch(SocketException){listener.Stop();listener=new TcpListener(IPAddress.Loopback,0);listener.Start();}
   port=((IPEndPoint)listener.LocalEndpoint).Port;running=true;
   var thread=new Thread(AcceptLoop){IsBackground=true,Name="AXIS09 HTTP"};thread.Start();
  }
  private void AcceptLoop() {
   while(running) {
    try {
     TcpClient client=listener.AcceptTcpClient();
     if(!slots.Wait(0)){client.Close();continue;}
     ThreadPool.QueueUserWorkItem(delegate{try{Handle(client);}catch(IOException){}catch(SocketException){}finally{client.Close();slots.Release();}});
    } catch(SocketException){if(!running)return;}
      catch(ObjectDisposedException){return;}
   }
  }
  private void Handle(TcpClient client) {
   client.ReceiveTimeout=5000;client.SendTimeout=10000;
   using(NetworkStream stream=client.GetStream()) {
    var header=new List<byte>(1024);int value;
    while(header.Count<16384&&(value=stream.ReadByte())>=0) {
     header.Add((byte)value);int n=header.Count;
     if(n>=4&&header[n-4]==13&&header[n-3]==10&&header[n-2]==13&&header[n-1]==10)break;
    }
    if(header.Count>=16384){Reply(stream,431,"text/plain",Encoding.UTF8.GetBytes("Request headers too large"),false,null);return;}
    string[] lines=Encoding.ASCII.GetString(header.ToArray()).Split(new[]{"\r\n"},StringSplitOptions.None);
    string[] request=lines[0].Split(' ');
    if(request.Length!=3||!request[1].StartsWith("/")||request[1].StartsWith("//")){Reply(stream,400,"text/plain",Encoding.UTF8.GetBytes("Bad request"),false,null);return;}
    bool head=request[0]=="HEAD";
    if(request[0]!="GET"&&!head){Reply(stream,405,"text/plain",Encoding.UTF8.GetBytes("GET and HEAD only"),false,"Allow: GET, HEAD\r\n");return;}
    string host=null,range=null;
    foreach(string line in lines){int colon=line.IndexOf(':');if(colon<0)continue;string key=line.Substring(0,colon).Trim();string content=line.Substring(colon+1).Trim();if(key.Equals("Host",StringComparison.OrdinalIgnoreCase))host=content;if(key.Equals("Range",StringComparison.OrdinalIgnoreCase))range=content;}
    if(host!="127.0.0.1:"+port&&host!="localhost:"+port){Reply(stream,403,"text/plain",Encoding.UTF8.GetBytes("Local host only"),head,null);return;}
    string path;
    try{path=Uri.UnescapeDataString(request[1].Split('?')[0]);}catch(UriFormatException){Reply(stream,400,"text/plain",new byte[0],head,null);return;}
    if(path.IndexOf('\\')>=0||path.IndexOf('\0')>=0||Array.IndexOf(path.Split('/'),"..")>=0){Reply(stream,404,"text/plain",new byte[0],head,null);return;}
    if(path=="/__axis/health"){Reply(stream,200,"application/json; charset=utf-8",Encoding.UTF8.GetBytes("{\"app\":\"AXIS09\",\"version\":\""+Program.Version+"\",\"port\":"+port+"}"),head,null);return;}
    string name=path=="/"?"showcase.html":path.TrimStart('/');
    byte[] body;
    if(!files.TryGetValue(name,out body)){Reply(stream,404,"text/plain; charset=utf-8",Encoding.UTF8.GetBytes("找不到頁面"),head,null);return;}
    if(range!=null&&!head) {
     long start,end;
     if(!ParseRange(range,body.LongLength,out start,out end)){Reply(stream,416,"text/plain",new byte[0],false,"Content-Range: bytes */"+body.Length+"\r\n");return;}
     Headers(stream,206,Mime(name),end-start+1,"Content-Range: bytes "+start+"-"+end+"/"+body.Length+"\r\n");
     stream.Write(body,(int)start,(int)(end-start+1));return;
    }
    Reply(stream,200,Mime(name),body,head,null);
   }
  }
  private static bool ParseRange(string value,long size,out long start,out long end) {
   start=0;end=size-1;if(size==0||!value.StartsWith("bytes=")||value.Contains(","))return false;
   string[] pair=value.Substring(6).Split('-');if(pair.Length!=2)return false;
   long number;
   if(pair[0].Length==0){if(!long.TryParse(pair[1],out number)||number<=0)return false;start=Math.Max(0,size-number);return true;}
   if(!long.TryParse(pair[0],out start)||start<0||start>=size)return false;
   if(pair[1].Length>0){if(!long.TryParse(pair[1],out number)||number<start)return false;end=Math.Min(size-1,number);}
   return true;
  }
  private static void Reply(Stream stream,int status,string type,byte[] body,bool head,string extra) {
   Headers(stream,status,type,body.Length,extra);if(!head)stream.Write(body,0,body.Length);
  }
  private static void Headers(Stream stream,int status,string type,long length,string extra) {
   string reason=status==200?"OK":status==206?"Partial Content":status==404?"Not Found":status==405?"Method Not Allowed":status==416?"Range Not Satisfiable":status==431?"Request Header Fields Too Large":status==403?"Forbidden":"Bad Request";
   string headers="HTTP/1.1 "+status+" "+reason+"\r\nContent-Type: "+type+"\r\nContent-Length: "+length+"\r\nConnection: close\r\nCache-Control: no-store\r\nAccept-Ranges: bytes\r\nX-Content-Type-Options: nosniff\r\nReferrer-Policy: no-referrer\r\nCross-Origin-Opener-Policy: same-origin\r\nPermissions-Policy: camera=(), microphone=(), geolocation=()\r\nContent-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'\r\n"+extra+"\r\n";
   byte[] bytes=Encoding.ASCII.GetBytes(headers);stream.Write(bytes,0,bytes.Length);
  }
  private static string Mime(string path) {
   switch(Path.GetExtension(path).ToLowerInvariant()) {
    case ".html":return "text/html; charset=utf-8";case ".css":return "text/css; charset=utf-8";case ".js":case ".mjs":return "text/javascript; charset=utf-8";
    case ".json":return "application/json; charset=utf-8";case ".webmanifest":return "application/manifest+json; charset=utf-8";case ".svg":return "image/svg+xml";
    case ".png":return "image/png";case ".jpg":case ".jpeg":return "image/jpeg";case ".webp":return "image/webp";case ".glb":return "model/gltf-binary";
    case ".pdf":return "application/pdf";case ".md":case ".txt":return "text/plain; charset=utf-8";default:return "application/octet-stream";
   }
  }
  public void Dispose(){running=false;if(listener!=null)listener.Stop();}
 }
}

