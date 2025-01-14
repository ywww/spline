/*
 * Copyright 2019 ABSA Group Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package za.co.absa.spline.consumer.rest

import java.util
import java.util.Arrays.asList

import org.apache.commons.configuration.{CompositeConfiguration, EnvironmentConfiguration, SystemConfiguration}
import org.springframework.context.annotation.{ComponentScan, Configuration, Import}
import org.springframework.web.method.support.HandlerMethodReturnValueHandler
import org.springframework.web.servlet.config.annotation.{EnableWebMvc, WebMvcConfigurer}
import za.co.absa.spline.common.config.ConfTyped
import za.co.absa.spline.common.webmvc.jackson.JacksonConfig
import za.co.absa.spline.common.webmvc.{EstimableFutureReturnValueHandlerSupport, ScalaFutureMethodReturnValueHandler, UnitMethodReturnValueHandler}

import scala.concurrent.duration._

@EnableWebMvc
@Configuration
@Import(Array(classOf[JacksonConfig]))
@ComponentScan(basePackageClasses = Array(
  classOf[controller._package]
))
class ConsumerRESTConfig extends WebMvcConfigurer {

  import scala.concurrent.ExecutionContext.Implicits.global

  override def addReturnValueHandlers(returnValueHandlers: util.List[HandlerMethodReturnValueHandler]): Unit = {
    returnValueHandlers.add(new UnitMethodReturnValueHandler)
    returnValueHandlers.add(new ScalaFutureMethodReturnValueHandler with EstimableFutureReturnValueHandlerSupport {
      override protected val minEstimatedTimeout: Long = ConsumerRESTConfig.AdaptiveTimeout.min
      override protected val durationToleranceFactor: Double = ConsumerRESTConfig.AdaptiveTimeout.durationFactor
    })
    returnValueHandlers.add(new ScalaFutureMethodReturnValueHandler)
  }
}

object ConsumerRESTConfig extends CompositeConfiguration(asList(
  new SystemConfiguration,
  new EnvironmentConfiguration))
  with ConfTyped {

  override val rootPrefix: String = "spline"

  object AdaptiveTimeout extends Conf("adaptive_timeout") {

    val min: Long = getLong(Prop("min"), 3.seconds.toMillis)
    val durationFactor: Double = getDouble(Prop("duration_factor"), 1.5)
  }

}
