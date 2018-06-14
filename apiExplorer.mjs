import OM_WSSE from './omWSSE.mjs'
export default (function($) {
    window.ApiExplorer = {
      env:   {},
      wsse:  new OM_WSSE(),
  
      /** Handler to show and hide the advanced options section */
      toggleAdvancedOptions: function (event)
      {
        var showAdvancedOptions = event.data;
        if (showAdvancedOptions)
        {
             $("#api-auth-advanced-options-show").hide();
             $("#api-auth-advanced-options-hide").show();
             $("#api-auth-advanced-options").show();
        }
        else
        {
             $("#api-auth-advanced-options-show").show();
             $("#api-auth-advanced-options-hide").hide();
             $("#api-auth-advanced-options").hide();
        }
      },
  
      /** Handler to edit post URL */
      editPostUrl: function (event)
      {
          $("#api-post-url").removeAttr('readonly').removeClass('noneditable');
          $(this).hide();
          $("#api-post-url").focus();
          return false;
      },
  
      /** Handler to edit environments */
      editEnvironment: function (event)
      {
          $("#api-environment-readonly").hide();
          $("#api-environment").show();
          $(this).hide();
          return false;
      },
  
      refreshApis: function (event)
      {
          $('#api-api').html(''); // clear dropdown
          var versionElement = $('#api-version');
          var api = '';
          if (window.location.hash) {
              var method = window.location.hash.substring(1);
              api = method.split('.')[0];
          }
  
          $.ajax({
              url: versionElement.attr('href'),
              data: {'version': ApiExplorer.getApiVersion()},
              dataType: 'json',
              success: function(data) {
                  var options = '<option value=""> -- Select API -- </option>';
                  for(x in data) {
                     if (api == data[x]) {
                       options += '<option value="'+data[x]+'" selected="selected"> '+data[x]+' </option>';
                     } else {
                       options += '<option value="'+data[x]+'"> '+data[x]+' </option>';
                     }
                  }
  
                  $('#api-api').html(options);
              }
          });
  
          return false;
      },
      /** Handler to update API methods */
      refreshApiMethods: function (event)
      {
          $('#api-method').html(''); // clear dropdown
              var apiElement = $('select[name=api-api]');
          var api  = apiElement.val();
  
          $.ajax({
              url: apiElement.attr('href'),
              data: {'api': api, 'version': ApiExplorer.getApiVersion()},
              dataType: 'json',
              success: function(data) {
                  var options = '<option value=""> -- Select Method -- </option>';
                  for(x in data) {
                     options += '<option value="'+x+'"> '+data[x]+' </option>';
                  }
  
                  $('#api-method').html(options);
                  $('#api-padding').show();
              }
          });
  
          return false;
      },
  
      refreshApiByHash: function (hash, noscroll)
      {
      var method = hash.substring(1);
      var api    = method.split('.')[0];
  
          $('#api-api').val(api); // clear dropdown
          $('#api-method').html(''); // clear dropdown
  
          $.ajax({
              url: $('#api-api').attr('href'),
              data: {'api': api, 'version': ApiExplorer.getApiVersion()},
              dataType: 'json',
              success: function(data) {
                  var options = '<option value=""> -- Select Method -- </option>';
                  for(x in data) {
                     options += '<option value="'+x+'"> '+data[x]+' </option>';
                  }
  
                  $('#api-method').html(options);
                  $('#api-method').val(method);
                  $('#api-method').change();
                  $('#api-padding').show();
                  if (!noscroll) window.scroll(0, $("#api-auth-form").offset().top);
              }
          });
  
          return false;
      },
  
      /** Handler to change the request type (rest) */
      changeRequestType: function (event)
      {
        ApiExplorer.buildRequest(event);
        ApiExplorer.changeEnvironment(event);
        $("#api-auth-headers").show();
      },
  
      changeApiVersion: function (event)
      {
        ApiExplorer.changeEnvironment(event);
        ApiExplorer.refreshApis();
        if (window.location.hash) {
          ApiExplorer.refreshApiByHash(window.location.hash, true);
        } else {
          ApiExplorer.refreshApiMethods();
        }
      },
  
      toggleNonceAutogen: function (event)
      {
        var nonce = $('#api-auth-nonce');
        if (event.target.checked)
        {
          nonce.attr("readonly", "readonly");
          nonce.addClass("noneditable");
        }
        else
        {
          nonce.attr("readonly", null).select();
          nonce.removeClass("noneditable");
        }
      },
  
      toggleCreatedAutogen: function (event)
      {
        var created = $('#api-auth-created');
        if (event.target.checked)
        {
          created.attr("readonly", "readonly");
          created.addClass("noneditable");
        }
        else
        {
          created.attr("readonly", null).select();
          created.removeClass("noneditable");
        }
      },
  
      /** Handler to switch the environment we're talking to */
      changeEnvironment: function (event)
      {
        var value = $("#api-environment").val();
        var posturl = $("#api-post-url");
  
        if (value == "custom")
        {
          posturl.attr("readonly", null).select();
          posturl.removeClass("noneditable");
        }
        else
        {
          posturl.attr("readonly", "readonly");
          posturl.addClass("noneditable");
          $("#edit-post-url").show();
        }
  
        ApiExplorer.setApiVersionInPostURL();
        if (ApiExplorer.getApiType() == "rest")
        {
          ApiExplorer.addMethodToRestPostURL();
        }
      },
  
      /** Change the selected method */
      changeMethod: function (event)
      {
        hash = $('#api-method').val();
        if (hash) {
          window.location.hash = hash;
        }
  
        ApiExplorer.buildRequest(event);
        if (ApiExplorer.getApiType() == "rest")
        {
          ApiExplorer.addMethodToRestPostURL();
        }
        ApiExplorer.retrieveDocumentation(event);
  
        $('#api-padding').hide();
      },
  
      /** Generate the auth credentials */
      generateAuth: function (event, callback)
      {
        if ($("#api-auth-nonce-autogen").attr("checked"))
        {
          $("#api-auth-nonce").val(ApiExplorer.wsse.generateNonce());
        }
        if ($("#api-auth-created-autogen").attr("checked"))
        {
          $("#api-auth-created").val(ApiExplorer.wsse.generateCreated());
        }
        ApiExplorer.wsse.set($("#api-auth-username").val(),
          $("#api-auth-secret").val(),
          $("#api-auth-nonce").val(),
          $("#api-auth-created").val(),
          $("#api-auth-app-key").val(),
          $("#api-auth-app-pass").val(),
          $("#api-auth-proxy-company").val(),
          $("#api-auth-proxy-user").val());
  
        params = ApiExplorer.wsse.encode();
        $("#api-auth-digest").val(params.d);
  
        var headers = ApiExplorer.wsse.generateRESTHeaders();
        $("#api-headers").val(headers);
        $("#api-auth-header").val(headers);
        if (callback)
        {
          callback();
        }
      },
  
      /** Retrieve the documentation snippet for this function */
      retrieveDocumentation: function (event)
      {
        var method = $("#api-method").val().split('.');
  
        if (method.length == 2) {
            var url = $("#api-documentation").attr('href').replace('_API_', method[0]).replace('_METHOD_', method[1]);
          $.ajax({
              url: url,
              dataType: 'html',
              success: function(data) {
                  if (data == "")
                  {
                    $("#api-tab-documentation").hide();
                  }
                  else
                  {
                   $("#api-documentation").html(data);
                    ApiDocumentation.initialize();
                   $("#api-tab-documentation").show();
                  }
              }
          });
        }
      },
  
      /** Build the request and update the request text box */
      buildRequest: function (event, regen, callback)
      {
        var method = $("#api-method").val();
        var request = $("#api-request").val();
        $("#api-request").val("");
        $("#api-response").html("");
        $("#api-make-request").attr("disabled", true);
        if (method)
        {
          $("#api-request").val("");
          $.post("/developer/get-api-request",
            {
              "type"    : ApiExplorer.getApiType(),
              "method"  : method,
                                          "version" : ApiExplorer.getApiVersion(),
              "headers" : $("#api-headers").val(),
              "request" : (regen ? request : "")
            },
            function (data) {
              $("#api-request").val(data);
              $("#api-make-request").removeAttr("disabled");
              if (callback)
              {
                callback();
              }
            },
          "text");
        }
      },
  
      /** Make the api request */
      makeRequest: function (event)
      {
        var method = $("#api-method").val();
  
        if ($("#api-response-type").val() == "genesis")
        {
          ApiExplorer.convertRequestToGenesis(event);
          return;
        }
  
        if (!method)
        {
          $("#api-response").html("");
        }
  
        ApiExplorer.generateAuth(event, function () {
          $("#api-response").html("Sending request for " + method + "()...");
  
          var request = new XMLHttpRequest();
          var url = $("#api-post-url").val();
          request.open('POST', url, true);
  
          var headersMap = ApiExplorer.wsse.generateRESTHeadersMap();
          for(var key in headersMap) {
            if(headersMap.hasOwnProperty(key)) {
                request.setRequestHeader(key, headersMap[key]);
            }
          }
          request.setRequestHeader('Content-Type', 'application/json');
  
          request.onreadystatechange = function() {
          if (request.readyState === XMLHttpRequest.DONE) {
              var prettyResponse = JSON.stringify(JSON.parse(request.responseText), null, 2);
              $("#api-response").html(prettyResponse);
           }
          };
  
          request.send($("#api-request").val());
        });
      },
  
      /** Update the method in the rest post url */
      addMethodToRestPostURL: function ()
      {
        var method = $("#api-method").val() || "<METHOD>";
        var parts = $("#api-post-url").val().split("?");
        var qs = parts[1].split("&");
        for (var i = 0; i < qs.length; i++)
        {
          if (qs[i].indexOf("method=") === 0)
          {
            qs[i] = "method=" + method;
          }
        }
        parts[1] = qs.join("&");
        $("#api-post-url").val(parts.join("?"));
      },
  
      setApiVersionInPostURL: function ()
      {
        var version = ApiExplorer.getApiVersion();
        var url = $("#api-post-url").val().replace(/\/admin\/\d.\d/, '/admin/'+version);
        $("#api-post-url").val(url);
      },
  
      /** Replace the request with genesis script formatted XML */
      convertRequestToGenesis: function (event)
      {
        var method = $("#api-method").val();
        var request = $("#api-request").val();
  
        $("#api-response").html("");
        $.post("/developer/get-genesis-xml",
          {
            "type"    : ApiExplorer.getApiType(),
            "method"  : method,
            "request" : request
          },
          function (data) {
            $("#api-response").html(data);
          },
        "text");
      },
  
      /** Convenience method for API type */
      getApiType: function()
      {
          return 'rest';
      },
  
      getApiVersion: function()
      {
          return '1.4';
      },
  
      /** Initialize the controller object */
      initialize: function (environments, image_path)
      {
        this.env = environments || {};
  
        $("#api-type").buttonset();
        $("#api-version").buttonset();
  
        $("#api-auth-advanced-options-show").bind("click", true, this.toggleAdvancedOptions);
        $("#api-auth-advanced-options-hide").bind("click", false, this.toggleAdvancedOptions);
  
        $("#api-type").bind("change", this.changeRequestType);
        $("#api-version").bind("change", this.changeApiVersion);
        $("#api-api").bind("change", this.refreshApiMethods);
        $("#api-method").bind("change", this.changeMethod);
        $("#api-environment").bind("change", this.changeEnvironment);
  
        $("#api-regen").bind("click", this.generateAuth);
        $("#api-make-request").bind("click", this.makeRequest);
        $("#edit-post-url").bind("click", this.editPostUrl);
        $("#edit-environment").bind("click", this.editEnvironment);
  
        $("#api-auth-nonce-autogen").bind("click", this.toggleNonceAutogen);
        $("#api-auth-created-autogen").bind("click", this.toggleCreatedAutogen);
  
        document.forms["api_explorer"].reset();
        this.generateAuth({"data": "rest"});
  
        this.changeEnvironment({"data": "rest"});
  
        $("#content h1.title").append($(document.createElement("IMG")).attr({
          "src":    image_path + "/icon_beta.png",
          "height": 21,
          "width":  41,
          "style":  "padding-left: 5px;"
        }));
  
        $(".resize-handle").ApiExplorerTextAreaResizer();
  
        if (window.location.hash) {
          this.refreshApiByHash(window.location.hash);
        }
      }
    };
  })(jQuery, OM_WSSE);
  
  function LoadApiExplorer(environments, image_path)
  {
    ApiExplorer.initialize(environments, image_path);
  }
  